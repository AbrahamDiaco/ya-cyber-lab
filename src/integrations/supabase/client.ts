import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tzwrbrydmgstlfkrqoug.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_tCA7hakUGmv6jbUeMJF2JQ_pH1yrCFJ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
