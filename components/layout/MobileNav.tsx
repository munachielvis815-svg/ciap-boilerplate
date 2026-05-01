'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { Layout, ChartBar, Briefcase, User, Gear } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';

const navItems = [
  { id: 'dashboard', label: 'Studio', icon: Layout, roles: ['creator', 'sme', 'agency', 'admin'] },
  { id: 'analytics', label: 'Metrics', icon: ChartBar, roles: ['creator', 'sme', 'agency', 'admin'] },
  { id: 'market', label: 'Find', icon: Briefcase, roles: ['sme', 'agency', 'admin'] },
  { id: 'profile', label: 'Profile', icon: User, roles: ['creator', 'sme', 'agency', 'admin'] },
  { id: 'settings', label: 'Settings', icon: Gear, roles: ['creator', 'sme', 'agency', 'admin'] },
];

export default function MobileNav() {
  const { user } = useAuthStore();
  const { data } = useMeProfile();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const role = data?.role || user?.role || 'creator';

  const setActiveTab = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
      <nav className="bg-white border-2 border-black rounded-[2.5rem] h-20 flex items-center justify-around px-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {navItems.map((item) => {
          const isAllowed = item.roles.includes(role);
          if (!isAllowed) return null;

          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all active:scale-95 ${isActive ? 'text-black' : 'text-zinc-300'}`}
            >
              <Icon size={24} weight={isActive ? "fill" : "bold"} className="transition-transform" />
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
