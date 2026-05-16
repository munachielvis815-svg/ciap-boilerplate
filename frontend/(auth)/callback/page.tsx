'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import api from '@/lib/api/client';
import { getPostLoginRoute } from '@/lib/auth/routes';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function Callback() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCallback = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        router.push('/login');
        return;
      }

      try {
        // Try to determine if this was a YouTube connection or a Login
        // We do this by checking if we have an active session already
        const { accessToken } = useAuthStore.getState();
        
        let endpoint = '/auth/socials/google/login/callback';
        
        if (accessToken) {
          // If we already have a token, we are likely connecting a social account
          endpoint = '/ingestion/youtube/oauth2/callback';
        }

        const { data } = await api.get(`${endpoint}${window.location.search}`, { 
          withCredentials: true,
          headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
        });

        if (data.user) {
          setAuth(data.user, data.accessToken, data.refreshToken);
          router.replace(getPostLoginRoute(data.user.role));
        } else {
          // YouTube connection successful, go back to dashboard
          await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
          toast.success('YouTube connected successfully!');
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        await queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        toast.error('Failed to complete the connection.');
        router.push('/dashboard');
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