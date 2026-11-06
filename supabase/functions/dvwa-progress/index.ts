import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const functionName = 'dvwa-progress';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-dvwa-timestamp, x-dvwa-signature, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const allowedLabs = new Set(['dvwa-sqli', 'dvwa-xss', 'dvwa-csrf', 'dvwa-access']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('DVWA_EVENT_SECRET');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !serviceRoleKey) {
    console.error(`[${functionName}] required secret is missing`);
    return response({ error: 'Integration is not configured' }, 503);
  }

  const timestamp = request.headers.get('x-dvwa-timestamp') ?? '';
  const suppliedSignature = request.headers.get('x-dvwa-signature') ?? '';
  const timestampSeconds = Number(timestamp);
  if (!/^\d{10}$/.test(timestamp) || !Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > 300) {
    return response({ error: 'Invalid or expired timestamp' }, 401);
  }

  const rawBody = await request.text();
  if (rawBody.length > 4096) return response({ error: 'Payload too large' }, 413);

  try {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${rawBody}`));
    const expectedSignature = `sha256=${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    if (!constantTimeEqual(suppliedSignature, expectedSignature)) return response({ error: 'Invalid signature' }, 401);

    const event = JSON.parse(rawBody);
    if (!event || !uuidPattern.test(event.event_id ?? '') || !uuidPattern.test(event.user_id ?? '') || !allowedLabs.has(event.lab_slug) || event.completed !== true) {
      return response({ error: 'Invalid completion event' }, 400);
    }
    const occurredAt = Date.parse(event.occurred_at);
    if (!Number.isFinite(occurredAt) || Math.abs(occurredAt / 1000 - timestampSeconds) > 300) {
      return response({ error: 'Invalid event time' }, 400);
    }

    const supabase = createClient('https://tzwrbrydmgstlfkrqoug.supabase.co', serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.rpc('record_dvwa_completion', {
      p_event_id: event.event_id,
      p_user_id: event.user_id,
      p_lab_slug: event.lab_slug,
      p_occurred_at: new Date(occurredAt).toISOString(),
    });
    if (error) {
      console.error(`[${functionName}] completion write failed`, { code: error.code });
      return response({ error: 'Could not record completion' }, 500);
    }
    return response({ accepted: true, recorded: data === true, duplicate: data === false });
  } catch (error) {
    console.error(`[${functionName}] request processing failed`, { error: String(error) });
    return response({ error: 'Invalid event payload' }, 400);
  }
});
