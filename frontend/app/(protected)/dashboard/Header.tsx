import { Bell, GearSix, Sidebar as SidebarIcon, List, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';
import { getAvatarSrc, getRoleLabel } from '@/lib/utils/avatars';
import Link from 'next/link';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  setActiveTab: (tab: string) => void;
}

export default function Header({ onToggleSidebar, isSidebarOpen, setActiveTab }: HeaderProps) {
  const { user } = useAuthStore();
  const { data: profile } = useMeProfile();

  const avatarSrc = profile?.profile?.avatarUrl || getAvatarSrc(user?.id ?? 'guest', user?.role ?? 'creator');
  const displayName = profile?.profile?.displayName || profile?.profile?.name || user?.name || 'Guest';
  const roleLabel = getRoleLabel(profile?.role || user?.role || 'creator');

  return (
    <header className="
      sticky top-0 z-40
      h-14 lg:h-16 w-full
      bg-[#F8F9FF]/80 backdrop-blur-xl
      border-b border-[#E5E7EB]
      flex items-center justify-between
      px-4 lg:px-8
    ">
      {/* Left Section: Mobile Menu + Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger - Only on mobile */}
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-white rounded-lg transition-colors text-[#3C4A3D]"
          >
            <List size={24} weight="bold" />
          </button>
          
          {/* Logo removed from mobile header as per request */}
        </div>

        <div className="hidden sm:flex flex-1 max-w-[320px] relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280] group-focus-within:text-[#006D32] transition-colors">
            <MagnifyingGlass size={16} weight="bold" />
          </div>
          <input
            type="text"
            placeholder="Search analytics, content..."
            className="w-full pl-9 pr-4 py-[6px] bg-[#EFF4FF] rounded-lg text-[12px] text-[#0B1C30] placeholder:text-[#6B7280]/50 border border-transparent focus:border-[#D3E4FE] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#006D32]/5 transition-all"
          />
        </div>
      </div>

      {/* Right Section: Actions + User */}
      <div className="flex items-center gap-3 lg:gap-5 pl-4">
        <button 
          onClick={() => setActiveTab('Notifications')}
          className="relative p-2 hover:bg-white rounded-lg transition-colors group"
        >
          <Bell size={20} weight="bold" className="text-[#3C4A3D] group-hover:text-[#006D32]" />
          {/* Badge removed if none - can be powered by actual count later */}
          {false && <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#006D32] rounded-full ring-2 ring-[#F8F9FF]" />}
        </button>

        <button 
          onClick={() => setActiveTab('Settings')}
          className="hidden lg:block p-2 hover:bg-white rounded-lg transition-colors"
        >
          <GearSix size={20} weight="bold" className="text-[#3C4A3D]" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 lg:gap-2.5 pl-3 border-l border-[#E5E7EB]">
          <div className="text-right hidden lg:block">
            <div className="font-bold text-[12px] text-[#0B1C30] leading-none mb-0.5">{displayName}</div>
            <div className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">{roleLabel}</div>
          </div>
          <div className="w-7 h-7 lg:w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-[#D3E4FE]">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}