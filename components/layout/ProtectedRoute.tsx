'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import api from '@/lib/api/client';

export default function ProtectedRoute({ children, requiredRole }: { 
  children: React.ReactNode; 
  requiredRole?: string;
}) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // 1. Wait for Zustand store to rehydrate from localStorage
    if (!_hasHydrated) return;

    // 2. If already authenticated via localStorage, we are good
    if (isAuthenticated) return;

    // 3. If not authenticated, try to hydrate from backend session (httpOnly cookies)
    const checkSession = async () => {
      try {
        // Use a direct axios call or a flag to bypass the aggressive 401 interceptor logout
        const { data } = await api.get('/users/me', { 
          withCredentials: true,
          // Custom header to tell interceptor not to logout on 401 for this specific check
          headers: { 'X-Skip-Auth-Redirect': 'true' } 
        } as any);
        useAuthStore.getState().setAuth(data.user, data.accessToken || '', data.refreshToken || '');
      } catch (err) {
        // No valid session cookie either, now we can safely redirect
        router.replace('/login');
      }
    };

    checkSession();
  }, [_hasHydrated, isAuthenticated, router]);

  // Show loading while Zustand rehydrates from localStorage
  if (!_hasHydrated) return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Skeleton Sidebar */}
      <div className="w-20 hidden md:flex flex-col items-center py-10 border-r border-zinc-100 bg-white h-full fixed">
         <div className="w-10 h-10 bg-zinc-100 rounded-xl mb-12 animate-pulse" />
         <div className="space-y-6 flex-1">
            {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 bg-zinc-50 rounded-xl animate-pulse" />)}
         </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 md:ml-20 flex flex-col">
         <div className="h-20 bg-white border-b border-zinc-100 px-10 flex items-center justify-between animate-pulse">
            <div className="w-64 h-10 bg-zinc-50 rounded-2xl" />
            <div className="w-32 h-10 bg-zinc-50 rounded-full" />
         </div>
         <div className="p-10 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1,2,3,4].map(i => <div key={i} className="h-44 bg-zinc-100 rounded-[2rem] animate-pulse" />)}
            </div>
            <div className="h-[400px] bg-zinc-100 rounded-[2.5rem] animate-pulse" />
         </div>
      </div>
    </div>
  );

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
