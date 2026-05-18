'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import api from '@/lib/api/client';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(!isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(false);
      return;
    }


    const checkSession = async () => {
      try {
        const { data } = await api.get('/users/me', { headers: { 'X-Skip-Auth-Redirect': 'true' } } as any);

        const userData = {
          id: data.profile.id,
          name: data.profile.name,
          email: data.profile.email,
          role: data.role,
          tenantId: data.profile.tenantId,
        };

        setAuth(userData as any);
        setLoading(false);
      } catch (err) {
        logout();
        router.replace('/login');
      }
    };

    checkSession();
  }, [isAuthenticated, setAuth, logout, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#006D32]/20 border-t-[#006D32] rounded-full animate-spin" />
          <p className="text-[12px] font-bold text-[#6B7280] uppercase tracking-widest">Verifying Session...</p>
       </div>
    </div>
  );

  return <>{children}</>;
}
