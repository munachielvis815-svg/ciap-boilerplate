'use client';

import { Bell, Info, ShieldCheck, UserCircle, Clock } from '@phosphor-icons/react';
import { useMyAuditLogs } from '@/lib/api/hooks';

export default function NotificationsScreen() {
  const { data: logs, isLoading } = useMyAuditLogs(30);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1C30] tracking-tight" style={{ fontFamily: "'Space Grotesk'" }}>Activity & Notifications</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">A secure history of your account actions and system alerts.</p>
        </div>
        <div className="px-4 py-2 bg-[#F0FDF4] text-[#006D32] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#DCFCE7]">
           Account Secure
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#F1F5F9] bg-[#FBFBFF] flex items-center gap-3">
           <Bell size={20} weight="bold" className="text-[#006D32]" />
           <h3 className="font-bold text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Personal Activity Log</h3>
        </div>
        
        <div className="divide-y divide-[#F1F5F9]">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-8 animate-pulse bg-white border-b border-[#F1F5F9]" />
            ))
          ) : logs?.length > 0 ? (
            logs.map((log: any, i: number) => (
              <div key={i} className="p-6 flex items-start gap-5 hover:bg-[#FBFBFF] transition-colors group">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F9FF] flex items-center justify-center shrink-0 text-[#006D32] group-hover:scale-110 transition-transform">
                   <Clock size={20} weight="bold" />
                </div>
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <p className="font-bold text-[#0B1C30] text-sm capitalize">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                   <p className="text-xs text-[#6B7280] mt-1">
                      Platform action performed on {log.entity} (ID: {log.entityId}).
                   </p>
                   <div className="flex items-center gap-2 mt-3">
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-[#EFF4FF] text-[#0059BB] rounded-md uppercase tracking-tighter">SUCCESS</span>
                      <span className="text-[10px] text-[#9CA3AF] font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-24 text-center">
               <div className="w-16 h-16 bg-[#F8F9FF] rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={32} className="text-[#9CA3AF]" />
               </div>
               <h4 className="font-bold text-[#0B1C30]">No Recent Activity</h4>
               <p className="text-xs text-[#6B7280] mt-2 max-w-[240px] mx-auto">Actions performed on your account will appear here for security transparency.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-[#0B1C30] p-6 rounded-3xl text-white shadow-xl">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-4">Governance Tip</h4>
            <p className="text-sm font-medium leading-relaxed">
              We log all administrative and account-level changes to ensure your data remains secure. If you see activity you don't recognize, contact support immediately.
            </p>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-[#F1F5F9] shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
               <Info size={24} className="text-[#006D32]" />
            </div>
            <div>
               <p className="text-xs font-bold text-[#0B1C30]">Login Protection</p>
               <p className="text-[10px] text-[#6B7280] mt-1">Your IP address and device are recorded for every session to prevent unauthorized access.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
