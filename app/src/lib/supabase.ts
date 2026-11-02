import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
if (!supabaseUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
if (!supabaseKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_KEY environment variable');

/**
 * The single Supabase client of the app. Only the services import it, never the screens.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  // Supabase defaults to a browser: keep the session in AsyncStorage instead of localStorage,
  // and don't look for a token in the URL (email/password login only).
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
