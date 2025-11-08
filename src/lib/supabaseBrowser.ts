import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let browserClient: ReturnType<typeof createClient> | undefined;

/**
 * Singleton Supabase browser client
 * Reuses the same connection for better performance
 */
export const supabaseBrowser = () => {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 0, // Disable Realtime ping to reduce overhead
        },
      },
    });
  }
  return browserClient;
};

