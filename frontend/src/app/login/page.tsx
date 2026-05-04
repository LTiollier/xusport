'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { ApiError, api, auth } from '@/lib/api';
import { markAuthed, runSync } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.login(email, password);
      auth.setToken(token);
      markAuthed();
      // Pull the full bundle into Dexie so the home screen lands with data.
      // Errors (timeout, partial network) don't block navigation — bootstrap
      // will retry once we land on /.
      try {
        await runSync();
      } catch {
        /* ignore — handled in store */
      }
      router.replace('/');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 422 || err.status === 401
            ? 'Identifiants invalides'
            : err.message
          : 'Connexion impossible — vérifiez votre réseau.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return <LoginScreen onLogin={handleLogin} loading={loading} error={error} />;
}
