'use client';

import { motion } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  TrendUp, 
  UserPlus, 
  ShieldCheck,
  DotsThreeVertical,
  Trash
} from '@phosphor-icons/react';
import { useState } from 'react';

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'performance',
    title: 'Content Performance Spike',
    description: 'Your latest video "How to Code" is performing 200% better than your average.',
    time: '2 mins ago',
    read: false,
    icon: TrendUp,
    iconBg: '#DCFCE7',
    iconColor: '#006D32'
  },
  {
    id: 2,
    type: 'security',
    title: 'New Login Detected',
    description: 'A new login was detected from London, UK using Chrome on MacOS.',
    time: '1 hour ago',
    read: false,
    icon: ShieldCheck,
    iconBg: '#FEF3C7',
    iconColor: '#B45309'
  },
  {
    id: 3,
    type: 'user',
    title: 'New Audience Milestone',
    description: 'Congratulations! You just reached 50,000 subscribers on YouTube.',
    time: '5 hours ago',
    read: true,
    icon: UserPlus,
    iconBg: '#EFF6FF',
    iconColor: '#1D4ED8'
  },
  {
    id: 4,
    type: 'system',
    title: 'System Update Complete',
    description: 'Omniview v2.4.0 has been deployed with improved ingestion logic.',
    time: 'Yesterday',
    read: true,
    icon: CheckCircle,
    iconBg: '#F3F4F6',
    iconColor: '#374151'
  }
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Notifications</h1>
          <p className="text-[#6B7280] text-sm mt-1">Stay updated with your platform activities and security.</p>
        </div>
        <button 
          onClick={markAllRead}
          className="text-sm font-bold text-[#006D32] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((n, i) => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group relative bg-white border rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-[#006D32]/5 ${n.read ? 'border-[#F1F5F9]' : 'border-[#006D32]/20 ring-1 ring-[#006D32]/5'}`}
            >
              <div className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: n.iconBg }}>
                  <n.icon size={24} weight="bold" style={{ color: n.iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`font-bold text-base tracking-tight ${n.read ? 'text-[#0B1C30]' : 'text-[#006D32]'}`} style={{ fontFamily: "'Space Grotesk'" }}>
                      {n.title}
                    </h3>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12} />
                          {n.time}
                       </span>
                       <button 
                         onClick={() => deleteNotification(n.id)}
                         className="p-1.5 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash size={16} weight="bold" />
                       </button>
                    </div>
                  </div>
                  <p className="text-[#6B7280] text-sm leading-relaxed max-w-2xl">{n.description}</p>
                </div>
              </div>
              {!n.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#006D32] rounded-full" />
              )}
            </motion.div>
          ))
        ) : (
          <div className="py-32 text-center">
             <div className="w-20 h-20 bg-[#F8F9FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell size={40} weight="duotone" className="text-[#D1D5DB]" />
             </div>
             <h3 className="text-xl font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>All Caught Up!</h3>
             <p className="text-[#6B7280] text-sm mt-2">No new notifications at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
