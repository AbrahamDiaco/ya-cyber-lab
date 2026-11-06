<?php

function yaCyberLabReportCompletion(string $labSlug): bool
{
    $allowedLabs = ['dvwa-sqli', 'dvwa-xss', 'dvwa-csrf', 'dvwa-access'];
    if (!in_array($labSlug, $allowedLabs, true) || !isset($_SESSION['ya_cyberlab_user_id'])) {
        return false;
    }

    $userId = (string) $_SESSION['ya_cyberlab_user_id'];
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $userId)) {
        return false;
    }

    $secret = getenv('YA_CYBERLAB_DVWA_EVENT_SECRET');
    $publishableKey = getenv('YA_CYBERLAB_SUPABASE_PUBLISHABLE_KEY');
    if (!$secret || !$publishableKey || !function_exists('curl_init')) {
        return false;
    }

    $timestamp = (string) time();
    $payload = json_encode([
        'event_id' => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)),
        'user_id' => $userId,
        'lab_slug' => $labSlug,
        'completed' => true,
        'occurred_at' => gmdate('c'),
    ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    $signature = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

    $request = curl_init('https://tzwrbrydmgstlfkrqoug.supabase.co/functions/v1/dvwa-progress');
    curl_setopt_array($request, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_TIMEOUT => 5,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'apikey: ' . $publishableKey,
            'x-dvwa-timestamp: ' . $timestamp,
            'x-dvwa-signature: ' . $signature,
        ],
    ]);
    $response = curl_exec($request);
    $status = (int) curl_getinfo($request, CURLINFO_RESPONSE_CODE);
    curl_close($request);

    return is_string($response) && $status >= 200 && $status < 300;
}
