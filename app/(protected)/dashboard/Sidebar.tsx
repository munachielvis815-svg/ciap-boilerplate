// // 'use client';
// // import { motion } from 'framer-motion';
// // import { useSearchParams, useRouter } from 'next/navigation';
// // import { 
// //   Layout, ChartBar, Briefcase, User, Gear, SignOut, 
// //   SquaresFour, Bell, Users, IdentificationCard, ChatCircleText
// // } from '@phosphor-icons/react';
// // import { useAuthStore } from '@/lib/auth/store';
// // import { useMeProfile } from '@/lib/api/hooks';
// // import { useMemo } from 'react';

// // const navItems = [
// //   { id: 'dashboard', label: 'Studio', icon: Layout, roles: ['creator', 'sme', 'agency', 'admin'] },
// //   { id: 'analytics', label: 'Metrics', icon: ChartBar, roles: ['creator', 'sme', 'agency', 'admin'] },
// //   { id: 'market', label: 'Find', icon: Briefcase, roles: ['sme', 'agency', 'admin'] },
// //   { id: 'profile', label: 'Profile', icon: User, roles: ['creator', 'sme', 'agency', 'admin'] },
// //   { id: 'settings', label: 'Settings', icon: Gear, roles: ['creator', 'sme', 'agency', 'admin'] },
// //   { id: 'chat', label: 'Chat', icon: ChatCircleText, roles: ['creator', 'sme', 'agency', 'admin'] },
// // ];

// // export default function Sidebar() {
// //   const { logout, user } = useAuthStore();
// //   const { data } = useMeProfile();
// //   const searchParams = useSearchParams();
// //   const router = useRouter();
// //   const activeTab = searchParams.get('tab') || 'dashboard';

// //   const role = data?.profile?.role || user?.role || 'creator';
// //   const isAdmin = role === 'admin';

// //   const filteredNavItems = useMemo(() => {
// //     return navItems.map(item => {
// //       if (isAdmin) {
// //         if (item.id === 'dashboard') return { ...item, label: 'Manage', icon: Users };
// //         if (item.id === 'analytics') return { ...item, label: 'Audit', icon: IdentificationCard };
// //         if (item.id === 'market') return null; // Hide market for admins
// //       }
// //       return item;
// //     }).filter(Boolean);
// //   }, [isAdmin]);

// //   const setActiveTab = (tab: string) => {
// //     router.push(`/dashboard?tab=${tab}`, { scroll: false });
// //   };

// //   return (
// //     <aside className="w-20 hidden md:flex flex-col items-center py-10 border-r border-[#E5E7EB] bg-white fixed h-full z-50">
// //       <div className="mb-14 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
// //          <div className="w-10 h-10 bg-gradient-to-br from-[#6B61F0] to-[#10B981] rounded-lg flex items-center justify-center text-white font-bold group-hover:rotate-180 transition-transform duration-500">
// //            O
// //          </div>
// //       </div>
      
// //       <nav className="flex-1 flex flex-col items-center gap-4 overflow-y-auto w-full">
// //          {filteredNavItems.map(item => {
// //            if (!item) return null;
// //            const isAllowed = item.roles.includes(role);
// //            if (!isAllowed) return null;

// //            const Icon = item.icon;
// //            const isActive = activeTab === item.id;

// //            return (
// //              <button
// //                key={item.id}
// //                onClick={() => setActiveTab(item.id)}
// //                className={`p-3 transition-all relative group rounded-xl border-2 border-transparent ${isActive ? 'text-[#6B61F0] bg-[#F0F4FF]' : 'text-[#9CA3AF] hover:text-[#0B1C30] hover:border-[#E5E7EB]'}`}
// //                title={item.label}
// //              >
// //                <Icon size={24} weight={isActive ? "fill" : "bold"} className="transition-transform group-hover:scale-110" />
// //              </button>
// //            );
// //          })}
// //       </nav>

// //       <button 
// //         onClick={() => { logout(); window.location.href = '/login'; }} 
// //         className="mb-8 p-3 text-[#9CA3AF] hover:text-[#EF4444] transition-all active:scale-90 group relative"
// //         title="Logout"
// //       >
// //          <SignOut size={24} weight="bold" className="transition-transform group-hover:scale-110" />
// //       </button>
// //     </aside>
// //   );
// // }

// 'use client';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { 
//   House, ChartLine, Users, User, GearSix, Chat, SignOut 
// } from '@phosphor-icons/react';
// import { useAuthStore } from '@/lib/auth/store';
// import Image from 'next/image';

// const navItems = [
//   { href: '/dashboard', label: 'Dashboard', icon: House },
//   { href: '/dashboard/content', label: 'Content', icon: ChartLine },
//   { href: '/dashboard/audience', label: 'Audience', icon: Users },
// ];

// export default function Sidebar() {
//   const pathname = usePathname();
//   const { user, logout } = useAuthStore();

//   return (
//     <aside className="w-64 h-screen bg-[#EFF4FF] border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-50">
//       {/* Logo */}
//       <div className="px-6 pt-8 pb-6 border-b border-[#E5E7EB]">
//         <div className="flex items-center gap-3">
//           <svg width="165" height="70" viewBox="0 0 165 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="scale-75 -ml-2">
//             {/* Your full SVG here */}
//             <path d="M61.0599 8.22729L57.3961 5.81219L53.7322 3.3971L61.0599 0.982003V8.22729Z" fill="#6B61F0"/>
//             {/* ... rest of your SVG paths ... */}
//           </svg>
//         </div>
//         <div className="mt-1">
//           <div className="font-bold text-2xl text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Omniview</div>
//           <div className="text-[10px] tracking-[1px] text-[#3C4A3D] font-medium">RESOURCE INTELLIGENCE</div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 px-3 py-6 space-y-1">
//         {navItems.map((item) => {
//           const isActive = pathname === item.href;
//           const Icon = item.icon;
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
//                 isActive 
//                   ? 'bg-white text-[#006D32] shadow-sm' 
//                   : 'text-[#3C4A3D] hover:bg-white/70'
//               }`}
//             >
//               <Icon size={22} weight={isActive ? "bold" : "regular"} />
//               {item.label}
//             </Link>
//           );
//         })}
//       </nav>

//       {/* User Profile */}
//       <div className="p-4 border-t border-[#E5E7EB]">
//         <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/70 cursor-pointer">
//           <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200">
//             {/* Replace with real avatar */}
//             <div className="w-full h-full bg-gradient-to-br from-[#6B61F0] to-[#10B981] flex items-center justify-center text-white text-xs font-bold">AR</div>
//           </div>
//           <div>
//             <div className="font-semibold text-sm">Alex River</div>
//             <div className="text-xs text-[#6B7280]">Elite Creator</div>
//           </div>
//         </div>

//         <button
//           onClick={logout}
//           className="mt-4 w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition"
//         >
//           <SignOut size={20} weight="bold" />
//           Logout
//         </button>
//       </div>
//     </aside>
//   );
// }


'use client';

import { House, ChartLineUp, UsersThree, List, SignOut } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const creatorNav = [
  { label: 'Dashboard', icon: House, tab: 'Dashboard' },
  { label: 'Content', icon: ChartLineUp, tab: 'Content' },
  { label: 'Audience', icon: UsersThree, tab: 'Audience' },
];

export default function Sidebar({ isOpen, toggle, activeTab, setActiveTab, role }: any) {
  const nav = role === 'creator' ? creatorNav : [
    { label: 'Discovery', icon: UsersThree, tab: 'Dashboard' },
  ];

  return (
    <motion.div
      animate={{ width: isOpen ? 280 : 80 }}
      className="h-screen bg-[#EFF4FF] border-r border-[#E5E7EB] flex flex-col fixed left-0 top-0 z-50 overflow-hidden"
    >
      <div className="p-6 flex items-center justify-between border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#006D32] rounded-2xl flex items-center justify-center text-white font-bold text-xl">O</div>
          {isOpen && <span className="font-bold text-2xl text-[#0B1C30]" style={{ fontFamily: 'Space Grotesk' }}>Omniview</span>}
        </div>
        <button onClick={toggle} className="lg:hidden p-2">
          <List size={24} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {nav.map((item: any) => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all ${
              activeTab === item.tab 
                ? 'bg-white text-[#006D32] shadow-sm' 
                : 'hover:bg-white/60 text-[#3C4A3D]'
            }`}
          >
            <item.icon size={24} weight={activeTab === item.tab ? "bold" : "regular"} />
            {isOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/70 cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#006D32] to-emerald-500 flex items-center justify-center text-white font-bold">AR</div>
          {isOpen && (
            <div>
              <p className="font-semibold">Alex Rivera</p>
              <p className="text-xs text-[#6B7280]">Elite Creator</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}