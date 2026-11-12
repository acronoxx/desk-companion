import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/models';
import { useAuth } from './useAuth';
import { getProfile } from '@/services/profile';

export type UseProfileResult = {
  /** The profile of the logged-in user, null while loading or if logged out. */
  profile: Profile | null;
  isLoading: boolean;
};

const ProfileContext = createContext<UseProfileResult | undefined>(undefined);

/**
 * Builds a profile from the session, used when the profiles row can't be read.
 * The signup stores the display name in the user metadata (the trigger copies it from there).
 */
function profileFromSession(user: User): Profile {
  const displayName = user.user_metadata?.display_name;
  return {
    id: user.id,
    display_name: typeof displayName === 'string' ? displayName : null,
    created_at: user.created_at,
  };
}

/**
 * Loads the profile (display name) of the logged-in user once and shares it with every screen.
 * Placed in the root _layout.tsx.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = user?.id;

  useEffect(() => {
    if (!user || !userId) return; // logged out: nothing to load

    let isCancelled = false;

    const load = async () => {
      try {
        const data = await getProfile(userId);
        if (!isCancelled) {
          setProfile(data);
        }
      } catch {
        // Right after signup the trigger may not have created the row yet, or the network failed:
        // the name from the session is good enough to greet the user.
        if (!isCancelled) {
          setProfile(profileFromSession(user));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    // A late answer (e.g. after a logout) must not overwrite the state.
    return () => {
      isCancelled = true;
    };
    // Only reload when the account changes, not when the token refreshes (new user object).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <ProfileContext.Provider value={{ profile, isLoading }}>{children}</ProfileContext.Provider>
  );
}

/**
 * Reads the shared profile. Must be used inside <ProfileProvider>.
 * Used by the Today and Settings tabs.
 *
 * @throws If called outside of <ProfileProvider>.
 */
export function useProfile(): UseProfileResult {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used inside <ProfileProvider>');
  }
  return context;
}
