'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import Sidebar from './Sidebar';
// import Header from './Header';
import CreatorDashboard from './creator-dashboard';
import AudienceInsights from './audience-insights';
import ContentPerformance from './content-performance';
import SMEDashboard from './sme-dashboard';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Content' | 'Audience'>('Dashboard');

  if (!user) return null;

  const isCreator = user.role === 'creator';
  const isSME = user.role === 'sme' || user.role === 'admin';

  return (
    <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={user.role}
      />

      {/* Main Area with proper margin */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[80px]'}`}>
        

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          {isSME ? (
            <SMEDashboard />
          ) : (
            <>
              {activeTab === 'Dashboard' && <CreatorDashboard />}
              {activeTab === 'Content' && <ContentPerformance />}
              {activeTab === 'Audience' && <AudienceInsights />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}