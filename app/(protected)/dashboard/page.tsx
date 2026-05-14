// 'use client';

// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { useRouter } from 'next/navigation';
// import { useAuthStore } from '@/lib/auth/store';
// import CreatorDashboard from './creator-dashboard';
// import AudienceInsights from './audience-insights';
// import ContentPerformance from './content-performance';
// import SMEDashboard from './sme-dashboard';

// type DashboardSection = 'Dashboard' | 'Audience' | 'Content';

// export default function DashboardPage() {
//   const router = useRouter();
//   const { user } = useAuthStore();
//   const [activeSection, setActiveSection] = useState<DashboardSection>('Dashboard');

//   // Redirect if not authenticated
//   if (!user) {
//     router.push('/login');
//     return null;
//   }

//   // Determine if user is SME/Admin or Creator
//   const isSME = user?.role === 'sme';
//   const isAdmin = user?.role === 'admin';
//   const isCreator = user?.role === 'creator';

//   // SME Dashboard - Creator Scouting (also shown to admins)
//   if (isSME || isAdmin) {
//     return (
//       <div className="min-h-screen bg-[#F9FAFB]">
//         {/* Header */}
//         <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]">
//           <div className="px-4 sm:px-8 lg:px-[60px] py-4 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path d="M30 5L50 15V45L30 55L10 45V15L30 5Z" fill="#6B61F0" fillOpacity="0.9" />
//                 <path d="M30 25L40 30V40L30 45L20 40V30L30 25Z" fill="white" />
//               </svg>
//               <span className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//                 Omniview
//               </span>
//             </div>

//             <div className="flex items-center gap-4">
//               <span className="px-3 py-1 bg-[#FEF3C7] text-[#92400E] rounded-full text-xs font-bold">
//                 ADMIN
//               </span>
//               <button
//                 onClick={() => useAuthStore.getState().logout()}
//                 className="px-4 py-2 text-sm font-bold text-[#006D32] hover:bg-[#F0FDF4] rounded-lg transition"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </header>

//         {/* Main Content */}
//         <main className="pt-20 px-4 sm:px-8 lg:px-[60px] py-8">
//           <div className="max-w-7xl mx-auto">
//             <SMEDashboard />
//           </div>
//         </main>
//       </div>
//     );
//   }

//   // Creator Dashboard
//   return (
//     <div className="min-h-screen bg-[#F9FAFB]">
//       {/* Header */}
//       <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]">
//         <div className="px-4 sm:px-8 lg:px-[60px] py-4 flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <svg width="32" height="32" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
//               <path d="M30 5L50 15V45L30 55L10 45V15L30 5Z" fill="#6B61F0" fillOpacity="0.9" />
//               <path d="M30 25L40 30V40L30 45L20 40V30L30 25Z" fill="white" />
//             </svg>
//             <span className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//               Omniview
//             </span>
//           </div>

//           <div className="flex items-center gap-4">
//             <button className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#0B1C30] transition">
//               {user?.email}
//             </button>
//             <button
//               onClick={() => useAuthStore.getState().logout()}
//               className="px-4 py-2 text-sm font-bold text-[#006D32] hover:bg-[#F0FDF4] rounded-lg transition"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="pt-20 px-4 sm:px-8 lg:px-[60px] py-8">
//         <div className="max-w-7xl mx-auto">
//           {/* Navigation Tabs */}
//           <div className="flex gap-8 mb-8 border-b border-[#E5E7EB] pb-4">
//             {(['Dashboard', 'Audience', 'Content'] as DashboardSection[]).map((section) => (
//               <button
//                 key={section}
//                 onClick={() => setActiveSection(section)}
//                 className={`px-1 py-2 font-bold text-sm transition border-b-2 -mb-4 ${
//                   activeSection === section
//                     ? 'border-[#006D32] text-[#006D32]'
//                     : 'border-transparent text-[#6B7280] hover:text-[#0B1C30]'
//                 }`}
//                 style={{ fontFamily: "'Space Grotesk'" }}
//               >
//                 {section}
//               </button>
//             ))}
//           </div>

//           {/* Content Sections */}
//           <motion.div
//             key={activeSection}
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -10 }}
//             transition={{ duration: 0.3 }}
//           >
//             {activeSection === 'Dashboard' && <CreatorDashboard />}
//             {activeSection === 'Audience' && <AudienceInsights />}
//             {activeSection === 'Content' && <ContentPerformance />}
//           </motion.div>
//         </div>
//       </main>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import DashboardLayout from './DashboardLayout';

export default function DashboardPage() {
  return <DashboardLayout />;
}