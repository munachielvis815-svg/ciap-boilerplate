'use client';

import { useState, createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store';
import Sidebar from '@/app/(protected)/dashboard/Sidebar';
import MobileSidebar from '@/app/(protected)/dashboard/MobileSidebar';
import Header from '@/app/(protected)/dashboard/Header';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

// ─── Dashboard Context ───────────────────────────────────────────────────────
// Generic string tab so each role can define its own tabs freely

interface DashboardContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
}

export const DashboardContext = createContext<DashboardContextType>({
  activeTab: 'Dashboard',
  setActiveTab: () => {},
  role: 'creator',
});

export const useDashboard = () => useContext(DashboardContext);

// ─── Default first tab per role ──────────────────────────────────────────────

function defaultTab(role: string): string {
  return 'Dashboard'; // All roles start at their "Dashboard" / "Discovery" / "Overview" tab
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const role = user?.role ?? 'creator';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(defaultTab(role));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ProtectedRoute>
      <DashboardContext.Provider value={{ activeTab, setActiveTab, role }}>
        {/* Full-screen shell */}
        <div className="flex h-screen bg-[#F8F9FF] overflow-hidden">

          {/* ── Fixed Sidebar (Desktop only) ── */}
          <Sidebar
            isOpen={isSidebarOpen}
            toggle={() => setIsSidebarOpen(prev => !prev)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            role={role}
          />

          {/* ── Mobile Sidebar (Slide-over) ── */}
          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            role={role}
          />

          {/* ── Right column: Header + scrollable content ── */}
          <div
            className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
              isSidebarOpen ? 'lg:ml-[200px]' : 'lg:ml-[64px]'
            } ml-0`}
          >
            {/* Sticky Top Bar — Hamburger on mobile opens MobileSidebar */}
            <Header 
              onToggleSidebar={() => {
                // Check if we are on mobile using window.innerWidth or just toggle both
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(true);
                } else {
                  setIsSidebarOpen(prev => !prev);
                }
              }} 
              isSidebarOpen={isSidebarOpen} 
              setActiveTab={setActiveTab}
            />

            {/* Scrollable page content */}
            <main className="flex-1 overflow-y-auto px-3 lg:px-8">
              <div className="max-w-[1600px] mx-auto pt-4 lg:pt-6 pb-6 lg:pb-10">
                {children}
              </div>
            </main>
          </div>
        </div>
      </DashboardContext.Provider>
    </ProtectedRoute>
  );
}