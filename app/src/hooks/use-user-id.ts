import { useEffect, useState } from 'react';

import { getSession } from '@/services/auth';

/** The logged-in user's id, null while loading or when nobody is logged in. */
export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getSession()
      .then((session) => setUserId(session?.user.id ?? null))
      .catch(() => setUserId(null));
  }, []);

  return userId;
}
