'use client';

import {
  House, ChartLineUp, UsersThree, GearSix, SignOut,
  MagnifyingGlass, ChartBar, Briefcase, Bell,
  ShieldCheck, UserList, SquaresFour, BookOpen, Faders,
  SidebarIcon,
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';
import { getAvatarSrc, getRoleLabel } from '@/lib/utils/avatars';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── Nav definitions per role ───────────────────────────────────────────────

const CREATOR_NAV = [
  { label: 'Dashboard', icon: House, tab: 'Dashboard' },
  { label: 'Content', icon: ChartLineUp, tab: 'Content' },
  { label: 'Audience', icon: UsersThree, tab: 'Audience' },
  // { label: 'Analytics',  icon: ChartBar,     tab: 'Analytics' },
  { label: 'Library', icon: BookOpen, tab: 'Library' },
  { label: 'Settings', icon: GearSix, tab: 'Settings' },
];

const SME_NAV = [
  { label: 'Discovery', icon: MagnifyingGlass, tab: 'Dashboard' },
  { label: 'Scouted', icon: UsersThree, tab: 'Scouted' },
  { label: 'Insights', icon: ChartBar, tab: 'Insights' },
  { label: 'Campaigns', icon: Briefcase, tab: 'Campaigns' },
  { label: 'Alerts', icon: Bell, tab: 'Alerts' },
  { label: 'Settings', icon: GearSix, tab: 'Settings' },
];

const ADMIN_NAV = [
  { label: 'Overview', icon: SquaresFour, tab: 'Dashboard' },
  { label: 'Users', icon: UserList, tab: 'Users' },
  { label: 'Creators', icon: UsersThree, tab: 'Creators' },
  { label: 'Analytics', icon: ChartBar, tab: 'Analytics' },
  { label: 'Audit Log', icon: Faders, tab: 'Audit' },
  { label: 'Security', icon: ShieldCheck, tab: 'Security' },
  { label: 'Settings', icon: GearSix, tab: 'Settings' },
];

function getNav(role: string) {
  if (role === 'sme') return SME_NAV;
  if (role === 'admin') return ADMIN_NAV;
  return CREATOR_NAV;
}

// ─── Main Sidebar ────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
}

export default function Sidebar({ isOpen, toggle, activeTab, setActiveTab, role }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { data: profile } = useMeProfile();
  const router = useRouter();
  const navItems = getNav(role);

  // Use real avatarUrl from backend profile if available, else fall back to avatar bank
  const avatarSrc = profile?.profile?.avatarUrl || getAvatarSrc(user?.id ?? 'guest', role);
  const displayName = profile?.profile?.displayName || profile?.profile?.name || user?.name || 'Guest';
  const roleLabel = getRoleLabel(role);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <motion.aside
      animate={{ width: isOpen ? 200 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-screen bg-[#EFF4FF] hidden lg:flex flex-col z-50 overflow-hidden flex-shrink-0 border-r border-[#E5E7EB]"
    >
      {/* ── Top Bar: Logo + Toggle ── */}
      <div className={`h-16 flex items-center border-b border-[#E5E7EB] transition-all duration-300 ${isOpen ? 'px-4' : 'px-0 justify-center'}`}>
        <div className={`flex items-center overflow-hidden transition-all duration-300 ${isOpen ? 'flex-1' : 'w-0 opacity-0'}`}>
          <Link href="/dashboard" className="flex items-center" onClick={() => setActiveTab('Dashboard')}>
            {isOpen ? (
              <svg width="160" height="40" viewBox="0 0 279 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M61.0599 8.22729L57.3961 5.81219L53.7323 3.3971L61.0599 0.982002V8.22729Z" fill="#6B61F0"/>
                <path d="M19.5364 50.4914L29.3066 36.0009L34.1918 39.6235L57.3961 5.81219M57.3961 5.81219L61.0599 8.22729V0.982002L53.7323 3.3971L57.3961 5.81219Z" stroke="#6B61F0" strokeWidth="1.42062"/>
                <path d="M34.1966 29.9562H9.771C9.771 29.9562 13.4348 23.3696 17.0987 20.735C20.7625 18.1003 26.8689 15.4657 26.8689 15.4657L34.1966 29.9562Z" fill="#6B61F0"/>
                <path d="M24.1457 32.0116L11.8558 53.3251C11.8558 53.3251 8.31028 47.0901 7.99818 42.6779C7.68609 38.2657 8.60299 31.7222 8.60299 31.7222L24.1457 32.0116Z" fill="#6B61F0"/>
                <path d="M21.2924 42.0373L34.5956 62.7475C34.5956 62.7475 27.3637 62.9294 23.2736 61.1382C19.1836 59.347 13.7632 55.4848 13.7632 55.4848L21.2924 42.0373Z" fill="#6B61F0"/>
                <path d="M29.3092 47.853L54.1033 46.8872C54.1033 46.8872 50.6284 53.1609 47.0069 55.7573C43.3855 58.3537 37.2846 61.0466 37.2846 61.0466L29.3092 47.853Z" fill="#6B61F0"/>
                <path d="M39.0784 44.4323L50.6558 22.7322C50.6558 22.7322 54.4059 28.849 54.864 33.2488C55.3221 37.6485 54.6224 44.2182 54.6224 44.2182L39.0784 44.4323Z" fill="#6B61F0"/>
                <path d="M78.8386 25.318C76.7266 25.318 75.0466 24.742 73.7986 23.59C72.5506 22.422 71.9266 20.758 71.9266 18.598V14.566C71.9266 12.406 72.5506 10.75 73.7986 9.598C75.0466 8.43 76.7266 7.846 78.8386 7.846C80.9506 7.846 82.6306 8.43 83.8786 9.598C85.1266 10.75 85.7506 12.406 85.7506 14.566V18.598C85.7506 20.758 85.1266 22.422 83.8786 23.59C82.6306 24.742 80.9506 25.318 78.8386 25.318ZM78.8386 22.486C80.0226 22.486 80.9426 22.142 81.5986 21.454C82.2546 20.766 82.5826 19.846 82.5826 18.694V14.47C82.5826 13.318 82.2546 12.398 81.5986 11.71C80.9426 11.022 80.0226 10.678 78.8386 10.678C77.6706 10.678 76.7506 11.022 76.0786 11.71C75.4226 12.398 75.0946 13.318 75.0946 14.47V18.694C75.0946 19.846 75.4226 20.766 76.0786 21.454C76.7506 22.142 77.6706 22.486 78.8386 22.486ZM88.6253 24.982V13.078H91.6013V14.374H92.0333C92.2413 13.974 92.5853 13.63 93.0653 13.342C93.5453 13.038 94.1773 12.886 94.9613 12.886C95.8093 12.886 96.4893 13.054 97.0013 13.39C97.5133 13.71 97.9053 14.134 98.1773 14.662H98.6093C98.8813 14.15 99.2653 13.726 99.7613 13.39C100.257 13.054 100.961 12.886 101.873 12.886C102.609 12.886 103.273 13.046 103.865 13.366C104.473 13.67 104.953 14.142 105.305 14.782C105.673 15.406 105.857 16.198 105.857 17.158V24.982H102.833V17.374C102.833 16.718 102.665 16.23 102.329 15.91C101.993 15.574 101.521 15.406 100.913 15.406C100.225 15.406 99.6893 15.63 99.3053 16.078C98.9373 16.51 98.7533 17.134 98.7533 17.95V24.982H95.7293V17.374C95.7293 16.718 95.5613 16.23 95.2253 15.91C94.8893 15.574 94.4173 15.406 93.8093 15.406C93.1213 15.406 92.5853 15.63 92.2013 16.078C91.8333 16.51 91.6493 17.134 91.6493 17.95V24.982H88.6253ZM109.11 24.982V13.078H112.086V14.638H112.518C112.71 14.222 113.07 13.83 113.598 13.462C114.126 13.078 114.926 12.886 115.998 12.886C116.926 12.886 117.734 13.102 118.422 13.534C119.126 13.95 119.67 14.534 120.054 15.286C120.438 16.022 120.63 16.886 120.63 17.878V24.982H117.606V18.118C117.606 17.222 117.382 16.55 116.934 16.102C116.502 15.654 115.878 15.43 115.062 15.43C114.134 15.43 113.414 15.742 112.902 16.366C112.39 16.974 112.134 17.83 112.134 18.934V24.982H109.11ZM123.899 24.982V13.078H126.923V24.982H123.899ZM125.411 11.686C124.867 11.686 124.403 11.51 124.019 11.158C123.651 10.806 123.467 10.342 123.467 9.766C123.467 9.19 123.651 8.726 124.019 8.374C124.403 8.022 124.867 7.846 125.411 7.846C125.971 7.846 126.435 8.022 126.803 8.374C127.171 8.726 127.355 9.19 127.355 9.766C127.355 10.342 127.171 10.806 126.803 11.158C126.435 11.51 125.971 11.686 125.411 11.686ZM132.77 24.982L128.978 13.078H132.194L134.954 22.774H135.386L134.954 22.774H135.386L138.146 13.078H141.362L137.57 24.982H132.77ZM143.422 24.982V13.078H146.446V24.982H143.422ZM144.934 11.686C144.39 11.686 143.926 11.51 143.542 11.158C143.174 10.806 142.99 10.342 142.99 9.766C142.99 9.19 143.174 8.726 143.542 8.374C143.926 8.022 144.39 7.846 144.934 7.846C145.494 7.846 145.958 8.022 146.326 8.374C146.694 8.726 146.878 9.19 146.878 9.766C146.878 10.342 146.694 10.806 146.326 11.158C145.958 11.51 145.494 11.686 144.934 11.686ZM155.221 25.318C154.037 25.318 152.989 25.07 152.077 24.574C151.181 24.062 150.477 23.35 149.965 22.438C149.469 21.51 149.221 20.422 149.221 19.174V18.886C149.221 17.638 149.469 16.558 149.965 15.646C150.461 14.718 151.157 14.006 152.053 13.51C152.949 12.998 153.989 12.742 155.173 12.742C156.341 12.742 157.357 13.006 158.221 13.534C159.085 14.046 159.757 14.766 160.237 15.694C160.717 16.606 160.957 17.67 160.957 18.886V19.918H152.293C152.325 20.734 152.629 21.398 153.205 21.91C153.781 22.422 154.485 22.678 155.317 22.678C156.165 22.678 156.789 22.494 157.189 22.126C157.589 21.758 157.893 21.35 158.101 20.902L160.573 22.198C160.349 22.614 160.021 23.07 159.589 23.566C159.173 24.046 158.613 24.462 157.909 24.814C157.205 25.15 156.309 25.318 155.221 25.318ZM152.317 17.662H157.885C157.821 16.974 157.541 16.422 157.045 16.006C156.565 15.59 155.933 15.382 155.149 15.382C154.333 15.382 153.685 15.59 153.205 16.006C152.725 16.422 152.429 16.974 152.317 17.662ZM164.562 24.982L162.882 13.078H165.882L166.938 22.942H167.37L168.906 13.078H173.754L175.29 22.942H175.722L176.778 13.078H179.778L178.098 24.982H173.082L171.546 15.118H171.114L169.578 24.982H164.562Z" fill="#006D32"/>
              </svg>
            ) : (
              <div className="w-full flex justify-center">
                <svg width="28" height="32" viewBox="0 0 63 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M61.0597 8.22729L57.3959 5.81219L53.732 3.3971L61.0597 0.982002V8.22729Z" fill="#6B61F0" />
                  <path d="M19.5361 50.4914L29.3064 36.0009L34.1915 39.6235L57.3959 5.81219M57.3959 5.81219L61.0597 8.22729V0.982002L53.732 3.3971L57.3959 5.81219Z" stroke="#6B61F0" strokeWidth="1.42062" />
                  <path d="M34.1966 29.9562H9.771C9.771 29.9562 13.4348 23.3696 17.0987 20.735C20.7625 18.1003 26.8689 15.4657 26.8689 15.4657L34.1966 29.9562Z" fill="#6B61F0" />
                  <path d="M24.1457 32.0116L11.8558 53.3251C11.8558 53.3251 8.31028 47.0901 7.99818 42.6779C7.68609 38.2657 8.60299 31.7222 8.60299 31.7222L24.1457 32.0116Z" fill="#6B61F0" />
                  <path d="M21.2922 42.0373L34.5954 62.7475C34.5954 62.7475 27.3635 62.9294 23.2734 61.1382C19.1833 59.347 13.763 55.4848 13.763 55.4848L21.2922 42.0373Z" fill="#6B61F0" />
                  <path d="M29.3093 47.853L54.1034 46.8872C54.1034 46.8872 50.6285 53.1609 47.007 55.7573C43.3856 58.3537 37.2848 61.0466 37.2848 61.0466L29.3093 47.853Z" fill="#6B61F0" />
                  <path d="M39.0784 44.4323L50.6558 22.7322C50.6558 22.7322 54.4059 28.849 54.864 33.2488C55.3221 37.6485 54.6224 44.2182 54.6224 44.2182L39.0784 44.4323Z" fill="#6B61F0" />
                </svg>
              </div>
            )}
          </Link>
        </div>
        
        <button 
          onClick={toggle}
          className={`p-2 hover:bg-white rounded-lg transition-colors text-[#3C4A3D]/60 hover:text-[#006D32] ${!isOpen ? 'w-10 h-10 flex items-center justify-center' : ''}`}
        >
          <SidebarIcon size={20} weight="bold" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              title={!isOpen ? item.label : undefined}
              className={`
                w-full flex items-center gap-2 px-3 py-1.5 rounded-lg
                transition-all duration-150 text-left
                ${isActive
                  ? 'bg-white text-[#006D32] shadow-sm font-semibold'
                  : 'text-[#3C4A3D] hover:bg-white/60 font-normal'}
                ${!isOpen ? 'justify-center' : ''}
              `}
            >
              <Icon size={16} weight={isActive ? 'bold' : 'regular'} className="flex-shrink-0" />
              {isOpen && (
                <span className="text-[12px] leading-5 tracking-[0.1px] whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── User Profile & Logout ── */}
      <div className="p-3 mt-auto border-t border-[#E5E7EB] space-y-3">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-[12px] font-bold bg-red-50 text-red-600 hover:bg-red-100 ${!isOpen ? 'justify-center' : ''}`}
          title={!isOpen ? "Logout" : undefined}
        >
          <SignOut size={18} weight="bold" />
          {isOpen && <span>Logout</span>}
        </button>

        <div className={`flex items-center gap-2.5 ${!isOpen ? 'justify-center' : 'px-1'}`}>
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 border border-white shadow-sm bg-[#D3E4FE]">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
          {isOpen && (
            <div className="overflow-hidden flex-1">
              <p className="font-semibold text-[12px] text-[#0B1C30] truncate leading-tight">{displayName}</p>
              <p className="text-[10px] text-[#3C4A3D]/60 truncate font-medium">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}