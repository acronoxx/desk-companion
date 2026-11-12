import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { onAuthChange } from '@/services/auth';

type AuthState = {
  /** The current Supabase session, or null if nobody is logged in. */
  session: Session | null;
  /** Shortcut for session.user. */
  user: User | null;
  /** True until the saved session has been read from AsyncStorage at launch. */
  isLoading: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

/**
 * Keeps the auth state of the whole app in sync with Supabase.
 * Screens never set the user themselves: they call the auth service
 * (signInWithEmail, signOut...) and this provider receives the change.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // The first call delivers the session restored from storage (or null).
    // Returning the unsubscribe function lets React stop listening on unmount.
    return onAuthChange((newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Reads the auth state. Must be used inside <AuthProvider>.
 *
 * @throws If called outside of <AuthProvider>.
 */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
