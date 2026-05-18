'use client';

import * as React from 'react';
import { 
  X, House, ChartLineUp, UsersThree, GearSix, SignOut, 
  MagnifyingGlass, ChartBar, Briefcase, Bell,
  SquaresFour, UserList, Faders, ShieldCheck
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';
import { getAvatarSrc, getRoleLabel } from '@/lib/utils/avatars';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
}

const NAV_MAP: Record<string, any[]> = {
  creator: [
    { label: 'Dashboard', icon: House, tab: 'Dashboard' },
    { label: 'Pulse', icon: ChartLineUp, tab: 'Content' },
    { label: 'Growth', icon: UsersThree, tab: 'Audience' },
    { label: 'Settings', icon: GearSix, tab: 'Settings' },
  ],
  sme: [
    { label: 'Explore', icon: MagnifyingGlass, tab: 'Dashboard' },
    { label: 'Stats', icon: ChartBar, tab: 'Insights' },
    { label: 'Campaigns', icon: Briefcase, tab: 'Campaigns' },
    { label: 'Settings', icon: GearSix, tab: 'Settings' },
  ],
  admin: [
    { label: 'Overview', icon: SquaresFour, tab: 'Dashboard' },
    { label: 'Users', icon: UserList, tab: 'Users' },
    { label: 'Audit', icon: Faders, tab: 'Audit' },
    { label: 'Settings', icon: GearSix, tab: 'Settings' },
  ]
};

export default function MobileSidebar({ isOpen, onClose, activeTab, setActiveTab, role }: MobileSidebarProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  const { user, logout } = useAuthStore();
  const { data: profile } = useMeProfile();
  const router = useRouter();
  const navItems = NAV_MAP[role] || NAV_MAP.creator;

  const avatarSrc = profile?.profile?.avatarUrl || getAvatarSrc(user?.id ?? 'guest', role);
  const displayName = profile?.profile?.displayName || profile?.profile?.name || user?.name || 'Guest';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0B1C30]/40 backdrop-blur-sm z-[100] lg:hidden"
          />

          {/* Side Panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#EFF4FF] z-[101] lg:hidden flex flex-col shadow-2xl border-r border-[#E5E7EB]"
          >
            {/* Header with Logo */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#E5E7EB]">
              <Link href="/dashboard" onClick={onClose} className="flex items-center">
                 <svg width="120" height="30" viewBox="0 0 279 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M61.0599 8.22729L57.3961 5.81219L53.7323 3.3971L61.0599 0.982002V8.22729Z" fill="#6B61F0"/>
                    <path d="M19.5364 50.4914L29.3066 36.0009L34.1918 39.6235L57.3961 5.81219M57.3961 5.81219L61.0599 8.22729V0.982002L53.7323 3.3971L57.3961 5.81219Z" stroke="#6B61F0" strokeWidth="1.42062"/>
                    <path d="M34.1966 29.9562H9.771C9.771 29.9562 13.4348 23.3696 17.0987 20.735C20.7625 18.1003 26.8689 15.4657 26.8689 15.4657L34.1966 29.9562Z" fill="#6B61F0"/>
                    <path d="M24.1457 32.0116L11.8558 53.3251C11.8558 53.3251 8.31028 47.0901 7.99818 42.6779C7.68609 38.2657 8.60299 31.7222 8.60299 31.7222L24.1457 32.0116Z" fill="#6B61F0"/>
                    <path d="M21.2924 42.0373L34.5956 62.7475C34.5956 62.7475 27.3637 62.9294 23.2736 61.1382C19.1836 59.347 13.7632 55.4848 13.7632 55.4848L21.2924 42.0373Z" fill="#6B61F0"/>
                    <path d="M29.3092 47.853L54.1033 46.8872C54.1033 46.8872 50.6284 53.1609 47.0069 55.7573C43.3855 58.3537 37.2846 61.0466 37.2846 61.0466L29.3092 47.853Z" fill="#6B61F0"/>
                    <path d="M39.0784 44.4323L50.6558 22.7322C50.6558 22.7322 54.4059 28.849 54.864 33.2488C55.3221 37.6485 54.6224 44.2182 54.6224 44.2182L39.0784 44.4323Z" fill="#6B61F0"/>
                    <path d="M78.8386 25.318C76.7266 25.318 75.0466 24.742 73.7986 23.59C72.5506 22.422 71.9266 20.758 71.9266 18.598V14.566C71.9266 12.406 72.5506 10.75 73.7986 9.598C75.0466 8.43 76.7266 7.846 78.8386 7.846C80.9506 7.846 82.6306 8.43 83.8786 9.598C85.1266 10.75 85.7506 12.406 85.7506 14.566V18.598C85.7506 20.758 85.1266 22.422 83.8786 23.59C82.6306 24.742 80.9506 25.318 78.8386 25.318ZM78.8386 22.486C80.0226 22.486 80.9426 22.142 81.5986 21.454C82.2546 20.766 82.5826 19.846 82.5826 18.694V14.47C82.5826 13.318 82.2546 12.398 81.5986 11.71C80.9426 11.022 80.0226 10.678 78.8386 10.678C77.6706 10.678 76.7506 11.022 76.0786 11.71C75.4226 12.398 75.0946 13.318 75.0946 14.47V18.694C75.0946 19.846 75.4226 20.766 76.0786 21.454C76.7506 22.142 77.6706 22.486 78.8386 22.486Z" fill="#006D32"/>
                 </svg>
              </Link>
              <button onClick={onClose} className="p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-lg">
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleTabClick(item.tab)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left
                      ${isActive 
                        ? 'bg-white text-[#006D32] shadow-sm font-bold' 
                        : 'text-[#3C4A3D] hover:bg-white/60 font-medium'}
                    `}
                  >
                    <Icon size={20} weight={isActive ? "bold" : "regular"} />
                    <span className="text-sm tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#F1F5F9] space-y-4">
               <button 
                 onClick={handleLogout}
                 className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 transition-all font-bold text-[15px]"
               >
                 <SignOut size={22} weight="bold" />
                 <span>Logout</span>
               </button>

               <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#EFF4FF] border border-[#E2E8F0]">
                    <img src={avatarSrc} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#0B1C30] truncate">{displayName}</p>
                    <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">{getRoleLabel(role)}</p>
                  </div>
               </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
