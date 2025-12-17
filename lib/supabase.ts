import { createClient } from '@supabase/supabase-js';

// Debug: log environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Environment check:', {
    hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    urlLength: import.meta.env.VITE_SUPABASE_URL?.length || 0,
    keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0,
    allEnvKeys: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  });
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `Missing Supabase environment variables.
  
  Expected variables:
  - VITE_SUPABASE_URL: ${supabaseUrl ? '✓ Found' : '✗ Missing'}
  - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Found' : '✗ Missing'}
  
  Available VITE_ variables: ${Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).join(', ') || 'None'}
  
  Please check:
  1. Vercel Environment Variables are set correctly
  2. Variables are named with VITE_ prefix
  3. Variables are enabled for Production environment
  4. A new deployment was triggered after adding variables`;
  
  console.error('Supabase initialization error:', errorMessage);
  throw new Error(errorMessage);
}

// Create Supabase client with optimized settings for faster auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'traidal-web'
    }
  }
});

