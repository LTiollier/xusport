'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { ApiError, api, auth } from '@/lib/api';

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
