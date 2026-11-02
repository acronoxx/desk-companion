import { supabase } from '../lib/supabase';

/**
 * Signs the user up with email and password.
 * The session is saved automatically (AsyncStorage).
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 * @throws If the credentials are wrong or the network fails.
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Signs the user in with email and password.
 * The session is saved automatically (AsyncStorage).
 *
 * @param email - The user's email address.
 * @param password - The user's password.
 * @throws If the credentials are wrong or the network fails.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Signs the user out.
 *
 * @throws If the network fails.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Gets the current session, read from AsyncStorage at app launch.
 *
 * @returns The session, or null if nobody is logged in.
 * @throws If the network fails.
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}
