'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import api from '@/lib/api/client';
import { getPostLoginRoute } from '@/lib/auth/routes';

export default function Callback() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Your NestJS returns tokens after Google OAuth
        const { data } = await api.get('/auth/google/callback' + window.location.search, { withCredentials: true });
        // rely on backend-set httpOnly cookies for persistence
        setAuth(data.user, data.accessToken, data.refreshToken);
        router.replace(getPostLoginRoute(data.user.role));
      } catch (err) {
        console.error(err);
        router.push('/login');
      }
    };
    handleCallback();
  }, [router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6 animal-float">🐨</div>
        <div className="text-3xl">Connecting your joy...</div>
      </div>
    </div>
  );
}