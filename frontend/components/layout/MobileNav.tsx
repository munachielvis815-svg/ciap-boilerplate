'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { 
  House, ChartLineUp, UsersThree, BookOpen, GearSix, MagnifyingGlass, Briefcase, ChartBar, Bell, SquaresFour, UserList, Faders, ShieldCheck
} from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';
import { useMemo } from 'react';

// Navigation items organized by role to match the sidebar
const NAV_GROUPS = {
  creator: [
    { id: 'Dashboard', label: 'Home', icon: House },
    { id: 'Content', label: 'Pulse', icon: ChartLineUp },
    { id: 'Audience', label: 'Growth', icon: UsersThree },
    { id: 'Settings', label: 'Gear', icon: GearSix },
  ],
  sme: [
    { id: 'Dashboard', label: 'Explore', icon: MagnifyingGlass },
    { id: 'Insights', label: 'Stats', icon: ChartBar },
    { id: 'Campaigns', label: 'Brief', icon: Briefcase },
    { id: 'Settings', label: 'Gear', icon: GearSix },
  ],
  admin: [
    { id: 'Dashboard', label: 'Core', icon: SquaresFour },
    { id: 'Users', label: 'Users', icon: UserList },
    { id: 'Analytics', label: 'Logs', icon: Faders },
    { id: 'Settings', label: 'Gear', icon: GearSix },
  ]
};

export default function MobileNav() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = (user?.role as keyof typeof NAV_GROUPS) || 'creator';
  
  const activeTab = searchParams.get('tab') || 'Dashboard';
  const navItems = NAV_GROUPS[role] || NAV_GROUPS.creator;

  const setActiveTab = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`, { scroll: false });
  };

  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md">
      <nav className="bg-[#0B1C30]/90 backdrop-blur-2xl rounded-[24px] h-[72px] flex items-center justify-around px-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-all active:scale-90"
            >
              <div className={`transition-all duration-300 ${isActive ? 'text-[#00D166] scale-110' : 'text-white/40'}`}>
                <Icon size={24} weight={isActive ? "fill" : "bold"} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-[1px] transition-all duration-300 ${isActive ? 'text-white' : 'text-white/20'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#00D166] rounded-full shadow-[0_0_8px_#00D166]" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
