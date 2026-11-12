// TEMPORARY HOOK: builds the profile from the session instead of the database.
// Replace the body with the profile service (getProfile) and keep the same
// return type: the screens only depend on it.

import type { Profile } from '@/types/models';
import { useAuth } from './useAuth';

export type UseProfileResult = {
  /** The profile of the logged-in user, null while loading or if logged out. */
  profile: Profile | null;
  isLoading: boolean;
};

export function useProfile(): UseProfileResult {
  const { user } = useAuth();

  if (user === null) {
    return { profile: null, isLoading: false };
  }

  // The signup stores the display name in the metadata, and the trigger copies it to profiles.
  const displayName = user.user_metadata?.display_name;
  return {
    profile: {
      id: user.id,
      display_name: typeof displayName === 'string' ? displayName : null,
      created_at: user.created_at,
    },
    isLoading: false,
  };
}
