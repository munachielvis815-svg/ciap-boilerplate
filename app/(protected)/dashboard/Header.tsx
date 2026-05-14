'use client';

import { Bell, GearSix, Plus } from '@phosphor-icons/react';
import { useAuthStore } from '@/lib/auth/store';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-20 bg-white/95 backdrop-blur-lg border-b border-[#E5E7EB] px-8 flex items-center justify-between z-40 sticky top-0">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-[448px]">
        <div className="relative">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6B7280]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 01-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search analytics, content, or insights..."
            className="w-full pl-12 pr-5 py-3 bg-[#EFF4FF] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#006D32]/30 placeholder:text-[#6B7280]"
          />
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <button className="relative p-3 hover:bg-[#F8F9FF] rounded-2xl transition-all">
          <Bell size={22} className="text-[#3C4A3D]" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></div>
        </button>

        {/* Settings */}
        <button className="p-3 hover:bg-[#F8F9FF] rounded-2xl transition-all">
          <GearSix size={22} className="text-[#3C4A3D]" />
        </button>

        {/* Create Button */}
        <button className="flex items-center gap-2 bg-[#006D32] text-white px-5 py-2.5 rounded-2xl font-semibold text-sm hover:bg-[#005227] transition-all">
          <Plus size={20} weight="bold" />
          Create
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-[#E5E7EB]">
          <div className="text-right">
            <div className="font-semibold text-sm">{user?.name || 'Shalom'}</div>
            <div className="text-xs text-[#6B7280] capitalize">{user?.role || 'Elite Creator'}</div>
          </div>
          <div className="w-9 h-9 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
            <div className="w-full h-full bg-gradient-to-br from-[#006D32] to-[#10B981] flex items-center justify-center text-white font-bold">
              S
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}