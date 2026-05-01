'use client';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { Layout, ChartBar, Briefcase, User, Gear, SignOut, SquaresFour, Bell } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';

const navItems = [
  { id: 'dashboard', label: 'Studio', icon: Layout, roles: ['creator', 'sme', 'agency', 'admin'] },
  { id: 'analytics', label: 'Metrics', icon: ChartBar, roles: ['creator', 'sme', 'agency', 'admin'] },
  { id: 'market', label: 'Find', icon: Briefcase, roles: ['sme', 'agency', 'admin'] },
  { id: 'profile', label: 'Profile', icon: User, roles: ['creator', 'sme', 'agency', 'admin'] },
  { id: 'settings', label: 'Settings', icon: Gear, roles: ['creator', 'sme', 'agency', 'admin'] },
];

export default function Sidebar() {
  const { logout, user } = useAuthStore();
  const { data } = useMeProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const role = data?.profile?.role || user?.role || 'creator';

  const setActiveTab = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  return (
    <aside className="w-20 hidden md:flex flex-col items-center py-10 border-r-2 border-black bg-white fixed h-full z-50">
      <div className="mb-14 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
         <SquaresFour size={32} weight="bold" className="text-black group-hover:rotate-90 transition-transform duration-500" />
      </div>
      
      <nav className="flex-1 flex flex-col items-center gap-10">
         {navItems.map(item => {
           const isAllowed = item.roles.includes(role);
           if (!isAllowed) return null;

           const Icon = item.icon;
           const isActive = activeTab === item.id;

           return (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`p-3 transition-all relative group rounded-xl border-2 border-transparent ${isActive ? 'text-black' : 'text-zinc-300 hover:text-black hover:border-black/5'}`}
               title={item.label}
             >
               <Icon size={24} weight={isActive ? "fill" : "bold"} className="transition-transform group-hover:scale-110" />
             </button>
           );
         })}
      </nav>

      <button onClick={() => { logout(); window.location.href = '/login'; }} className="p-4 text-zinc-300 hover:text-red-500 transition-all active:scale-90" title="Logout">
         <SignOut size={22} weight="bold" />
      </button>
    </aside>
  );
}