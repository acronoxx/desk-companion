import { supabase } from '../lib/supabase';
import type { Profile } from '../types/models';

/**
 * Gets the profile of a user.
 *
 * @param userId - The user's id (session.user.id).
 * @throws If the profile does not exist or the network fails.
 */
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Updates the display name of a user.
 *
 * @param userId - The user's id (session.user.id).
 * @param updates - The new display name.
 * @returns The updated profile.
 * @throws If the network fails.
 */
export async function updateProfile(
  userId: string,
  updates: Pick<Profile, 'display_name'>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
