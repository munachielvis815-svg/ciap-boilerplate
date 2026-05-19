'use client';
import { useAuthStore } from '@/lib/auth/store';
import { useMemo } from 'react';
import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api/client';

export default function Topbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const links = useMemo(() => {
    const role = user?.role;
    const base = [{ name: 'Dashboard', href: '/dashboard' }];

    if (role === 'creator' || role === 'admin') {
      base.push({ name: 'Insights', href: '/insights' }, { name: 'Performance', href: '/performance' });
    }

    if (role === 'sme' || role === 'admin') {
      base.push({ name: 'Discovery', href: '/discovery' }, { name: 'Compare', href: '/compare' });
    }

    base.push({ name: 'Sessions', href: '/sessions' }, { name: 'Settings', href: '/settings' });
    return base;
  }, [user?.role]);

  return (
    <header className="bg-[#E5E5E5]/95 backdrop-blur-sm w-full px-4 md:px-6 py-4 flex justify-between items-center border-b border-[#111]/10 sticky top-0 left-0 right-0 z-50">

      <div className="flex gap-2 items-center">
        <Link href="/dashboard" className="px-4 py-2 rounded-full border-2 border-black bg-white text-black font-black tracking-tighter text-lg transition-all hover:bg-zinc-50 active:scale-95">
          domiron
        </Link>
      </div>

      <div className="hidden lg:flex gap-2 overflow-x-auto px-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-5 py-2 rounded-full border-2 border-black text-sm font-bold transition-all active:scale-95 whitespace-nowrap ${isActive ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-50'}`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-3 items-center">
         <div className="flex items-center gap-3">
           <Avatar name={user?.name || user?.email || 'D'} />
           <div className="hidden md:block px-4 py-2 rounded-full border-2 border-black bg-white text-black font-bold text-sm">
              {user?.name || 'Architect'}
           </div>
         </div>
         <button 
           onClick={async () => {
             try {
               await api.post('/auth/logout');
             } catch {
               // If the session already expired, still clear local auth.
             } finally {
               logout();
               window.location.href = '/';
             }
           }} 
           className="w-10 h-10 rounded-full border-2 border-black flex justify-center items-center bg-white hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
         >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
         </button>
      </div>

    </header>
  );
}