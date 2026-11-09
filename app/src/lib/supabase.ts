import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { Database } from '../types/database'; // adapte le chemin

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;
if (!supabaseUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
if (!supabaseKey) throw new Error('Missing EXPO_PUBLIC_SUPABASE_KEY environment variable');

/**
 * The single Supabase client of the app. Only the services import it, never the screens.
 * Typed with the generated Database schema, so table and column names are checked.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  // Supabase defaults to a browser: keep the session in AsyncStorage instead of localStorage,
  // and don't look for a token in the URL (email/password login only).
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the session only while the app is in the foreground.
// In the background, timers are paused by the OS: refreshing resumes when the app comes back.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});