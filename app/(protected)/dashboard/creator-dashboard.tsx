// 'use client';

// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
// import { TrendUp, Eye, Users, ShoppingCart } from '@phosphor-icons/react';

// interface StatCard {
//   label: string;
//   value: string;
//   trend: string;
//   trendUp: boolean;
//   icon: any;
// }

// interface ContentItem {
//   id: string;
//   title: string;
//   platform: string;
//   views: string;
//   engagement: string;
//   engagementPercent: string;
//   status: 'trending' | 'stable' | 'viral';
//   thumbnail?: string;
// }

// interface CreatorDashboardProps {
//   onNavigate?: (section: string) => void;
//   selectedSection?: string;
// }

// const performanceData = [
//   { name: 'WK 01', videoViews: 4000, directEngagement: 2400 },
//   { name: 'WK 02', videoViews: 6000, directEngagement: 3400 },
//   { name: 'WK 03', videoViews: 8500, directEngagement: 5200 },
//   { name: 'WK 04', videoViews: 9200, directEngagement: 7100 }
// ];

// const recentContent: ContentItem[] = [
//   {
//     id: '1',
//     title: 'Mastering Lighting in Digital Art',
//     platform: 'YouTube',
//     views: '480.2k',
//     engagement: '8.2%',
//     engagementPercent: '8.2',
//     status: 'trending'
//   },
//   {
//     id: '2',
//     title: 'Daily Workflow & Productivity',
//     platform: 'Instagram',
//     views: '128.6k',
//     engagement: '12.1%',
//     engagementPercent: '12.1',
//     status: 'stable'
//   },
//   {
//     id: '3',
//     title: 'Quick Tips: Color Theory',
//     platform: 'TikTok',
//     views: '882.0k',
//     engagement: '15.4%',
//     engagementPercent: '15.4',
//     status: 'viral'
//   }
// ];

// const StatusBadge = ({ status }: { status: 'trending' | 'stable' | 'viral' }) => {
//   const colors = {
//     trending: 'bg-[#FEF3C7] text-[#92400E]',
//     stable: 'bg-[#DBEAFE] text-[#1E40AF]',
//     viral: 'bg-[#DCFCE7] text-[#166534]'
//   };

//   const labels = {
//     trending: 'TRENDING',
//     stable: 'STABLE',
//     viral: 'VIRAL'
//   };

//   return (
//     <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status]}`}>
//       {labels[status]}
//     </span>
//   );
// };

// const StatCard = ({ label, value, trend, trendUp, icon: Icon }: StatCard) => (
//   <motion.div
//     initial={{ opacity: 0, y: 10 }}
//     whileInView={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.4 }}
//     className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-sm hover:shadow-md transition"
//   >
//     <div className="flex items-start justify-between">
//       <div className="space-y-3 flex-1">
//         <p className="text-sm font-medium text-[#6B7280]">{label}</p>
//         <h3 className="text-2xl font-black text-[#0B1C30]">{value}</h3>
//         <p className={`text-sm font-bold ${trendUp ? 'text-[#006D32]' : 'text-[#DC2626]'}`}>
//           {trendUp ? '↑' : '↓'} {trend}
//         </p>
//       </div>
//       <div className="p-3 bg-[#F3F4F6] rounded-lg">
//         <Icon size={24} weight="fill" className="text-[#6B61F0]" />
//       </div>
//     </div>
//   </motion.div>
// );

// export default function CreatorDashboard({ onNavigate, selectedSection }: CreatorDashboardProps) {
//   return (
//     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
//       {/* Header with tabs */}
//       <div className="space-y-6">
//         <div>
//           <h1 className="text-3xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//             Omniview Creator Dashboard
//           </h1>
//           <p className="text-sm text-[#6B7280] mt-2" style={{ fontFamily: "'Inter'" }}>
//             Your resource intelligence overview for the last 30 days.
//           </p>
//         </div>

//         {/* Navigation tabs */}
//         <div className="flex gap-8 border-b border-[#E5E7EB]">
//           {['Dashboard', 'Content', 'Audience'].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => onNavigate?.(tab)}
//               className={`px-1 py-3 font-bold text-sm transition border-b-2 ${
//                 selectedSection === tab
//                   ? 'border-[#006D32] text-[#006D32]'
//                   : 'border-transparent text-[#6B7280] hover:text-[#0B1C30]'
//               }`}
//               style={{ fontFamily: "'Space Grotesk'" }}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatCard
//           label="Total Views"
//           value="1.2M"
//           trend="+12%"
//           trendUp={true}
//           icon={Eye}
//         />
//         <StatCard
//           label="Engagement Rate"
//           value="4.8%"
//           trend="Stable"
//           trendUp={true}
//           icon={TrendUp}
//         />
//         <StatCard
//           label="Follower Growth"
//           value="15k"
//           trend="+2.4%"
//           trendUp={true}
//           icon={Users}
//         />
//         <StatCard
//           label="Conversions"
//           value="850"
//           trend="+5%"
//           trendUp={true}
//           icon={ShoppingCart}
//         />
//       </div>

//       {/* Charts Section */}
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm"
//       >
//         <div className="space-y-6">
//           <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//             Performance Over Time
//           </h2>
//           <p className="text-xs text-[#6B7280]" style={{ fontFamily: "'Inter'" }}>
//             Visualizing cross-platform engagement pulse.
//           </p>

//           <div className="h-[300px] w-full">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//                 <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px', fontWeight: 'bold' }} />
//                 <YAxis stroke="#6B7280" style={{ fontSize: '12px', fontWeight: 'bold' }} />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: '#fff',
//                     border: '2px solid #E5E7EB',
//                     borderRadius: '8px',
//                     fontWeight: 'bold'
//                   }}
//                 />
//                 <Legend />
//                 <Line
//                   type="monotone"
//                   dataKey="videoViews"
//                   stroke="#00D166"
//                   strokeWidth={3}
//                   dot={{ fill: '#00D166', r: 5 }}
//                   name="VIDEO VIEWS"
//                   isAnimationActive={true}
//                 />
//                 <Line
//                   type="monotone"
//                   dataKey="directEngagement"
//                   stroke="#0059BB"
//                   strokeWidth={3}
//                   dot={{ fill: '#0059BB', r: 5 }}
//                   name="DIRECT ENGAGEMENT"
//                   isAnimationActive={true}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </motion.div>

//       {/* Recent Content Table */}
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="bg-white rounded-xl border border-[#E5E7EB] p-8 shadow-sm"
//       >
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h2 className="text-lg font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//               Recent Content
//             </h2>
//             <button className="text-sm font-bold text-[#006D32] hover:underline" style={{ fontFamily: "'Space Grotesk'" }}>
//               View All History ›
//             </button>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-[#E5E7EB]">
//                   <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
//                     Content Asset
//                   </th>
//                   <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
//                     Platform
//                   </th>
//                   <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
//                     Views
//                   </th>
//                   <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
//                     Engagement
//                   </th>
//                   <th className="text-left py-4 px-4 text-xs font-black text-[#6B7280] uppercase" style={{ fontFamily: "'Space Grotesk'" }}>
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {recentContent.map((item) => (
//                   <tr key={item.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition">
//                     <td className="py-4 px-4 font-bold text-[#0B1C30]" style={{ fontFamily: "'Inter'" }}>
//                       {item.title}
//                     </td>
//                     <td className="py-4 px-4 text-sm font-bold text-[#6B7280]" style={{ fontFamily: "'Space Grotesk'" }}>
//                       {item.platform}
//                     </td>
//                     <td className="py-4 px-4 text-sm font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//                       {item.views}
//                     </td>
//                     <td className="py-4 px-4 text-sm font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//                       {item.engagement}
//                     </td>
//                     <td className="py-4 px-4">
//                       <StatusBadge status={item.status} />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// }

'use client';

import { motion } from 'framer-motion';
import { Eye, Lightning, Users, ShoppingCart } from '@phosphor-icons/react';

export default function CreatorDashboard() {
  return (
    <div className="max-w-[1256px] mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[36px] leading-[40px] font-bold tracking-[-0.9px] text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
          Omniview Creator Dashboard
        </h1>
        <p className="text-[16px] text-[#3C4A3D] mt-2">
          Your resource intelligence overview for the last 30 days.
        </p>
      </div>

      {/* KPI Cards - Exact Figma Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Views */}
        <div className="bg-[#EFF4FF] rounded-2xl p-6 h-[164px] relative">
          <div className="flex justify-between">
            <div>
              <p className="text-[14px] text-[#3C4A3D]">Total Views</p>
              <p className="text-[30px] leading-[36px] font-bold text-[#0B1C30] mt-3" style={{ fontFamily: "'Space Grotesk'" }}>1.2M</p>
            </div>
            <div className="w-9 h-9 bg-white/80 rounded-xl flex items-center justify-center">
              <Eye size={22} className="text-[#006D32]" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 flex items-center gap-1 text-[#006D32] text-sm font-medium">
            ↑ +12%
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-[#E5EEFF] rounded-2xl p-6 h-[164px] relative">
          <div className="flex justify-between">
            <div>
              <p className="text-[14px] text-[#3C4A3D]">Engagement Rate</p>
              <p className="text-[30px] leading-[36px] font-bold text-[#0B1C30] mt-3" style={{ fontFamily: "'Space Grotesk'" }}>4.8%</p>
            </div>
            <div className="w-9 h-9 bg-white/80 rounded-xl flex items-center justify-center">
              <Lightning size={22} className="text-[#006D32]" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 text-[#006D32] text-sm font-medium">
            Stable
          </div>
        </div>

        {/* Follower Growth */}
        <div className="bg-[#EFF4FF] rounded-2xl p-6 h-[164px] relative">
          <div className="flex justify-between">
            <div>
              <p className="text-[14px] text-[#3C4A3D]">Follower Growth</p>
              <p className="text-[30px] leading-[36px] font-bold text-[#0B1C30] mt-3" style={{ fontFamily: "'Space Grotesk'" }}>15k</p>
            </div>
            <div className="w-9 h-9 bg-white/80 rounded-xl flex items-center justify-center">
              <Users size={22} className="text-[#006D32]" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 flex items-center gap-1 text-[#006D32] text-sm font-medium">
            ↑ +2.4k
          </div>
        </div>

        {/* Conversions */}
        <div className="bg-[#D3E4FE] rounded-2xl p-6 h-[164px] relative">
          <div className="flex justify-between">
            <div>
              <p className="text-[14px] text-[#3C4A3D]">Conversions</p>
              <p className="text-[30px] leading-[36px] font-bold text-[#0B1C30] mt-3" style={{ fontFamily: "'Space Grotesk'" }}>850</p>
            </div>
            <div className="w-9 h-9 bg-white/80 rounded-xl flex items-center justify-center">
              <ShoppingCart size={22} className="text-[#006D32]" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 flex items-center gap-1 text-[#006D32] text-sm font-medium">
            ↑ +5%
          </div>
        </div>
      </div>

      {/* Performance Over Time */}
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-[20px] font-bold text-[#0B1C30]">Performance Over Time</h2>
            <p className="text-[#3C4A3D] text-sm mt-1">Visualizing cross-platform engagement pulse.</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00D166] rounded-full"></div>
              VIDEO VIEWS
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#0059BB] rounded-full"></div>
              DIRECT ENGAGEMENT
            </div>
          </div>
        </div>

        <div className="h-[380px] bg-[#F8F9FF] rounded-2xl flex items-center justify-center border border-dashed">
          <p className="text-gray-400">Line Chart Area (Video Views vs Engagement) — Connect later</p>
        </div>
      </div>

      {/* Recent Content */}
      <div className="bg-white rounded-3xl p-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Content</h2>
          <a href="#" className="text-[#006D32] text-sm font-medium hover:underline">View All History →</a>
        </div>

        <div className="space-y-6">
          {[
            { title: "Mastering Lighting in Digital Art", platform: "YouTube", views: "450.2k", eng: "8.2%", status: "TRENDING" },
            { title: "Daily Workflow & Productivity", platform: "Instagram", views: "128.5k", eng: "12.1%", status: "STABLE" },
            { title: "Quick Tips: Color Theory", platform: "TikTok", views: "892.0k", eng: "15.4%", status: "VIRAL" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-6 py-4 border-b last:border-none">
              <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-500">{item.platform}</p>
              </div>
              <div className="hidden md:block text-right">
                <p className="font-semibold">{item.views}</p>
                <p className="text-xs text-gray-500">{item.eng} engagement</p>
              </div>
              <div className={`px-4 py-1 rounded-full text-xs font-bold ${
                item.status === 'VIRAL' ? 'bg-green-100 text-green-700' : 
                item.status === 'TRENDING' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}