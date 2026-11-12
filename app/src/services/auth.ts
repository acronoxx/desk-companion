import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

/**
 * Signs the user up. The display name is stored in the user metadata,
 * then copied into `profiles` by the database trigger.
 *
 * @returns The Supabase data. `session` is null if email confirmation is required.
 * @throws AuthError (e.g. code 'email_exists', 'weak_password').
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
  return data;
}

/**
 * Signs the user in with email and password.
 * The session is saved automatically (AsyncStorage).
 *
 * @throws AuthError (e.g. code 'invalid_credentials', 'email_not_confirmed').
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * Signs the user out and removes the saved session.
 *
 * @throws AuthError if the network fails.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribes to session changes (initial session at launch, sign in, sign out, token refresh).
 *
 * @returns A function that unsubscribes.
 */
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}