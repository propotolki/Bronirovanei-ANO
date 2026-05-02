import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Graceful fallback: if env vars are missing, log warning but don't crash module load
if (typeof window === 'undefined') {
  // Server-side only check
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing env variables: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. API routes will fail.');
  }
}

export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const supabaseAdmin = supabaseUrl
  ? createClient(
      supabaseUrl,
      serviceRoleKey ?? supabaseAnonKey ?? '',
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    )
  : null as any;
