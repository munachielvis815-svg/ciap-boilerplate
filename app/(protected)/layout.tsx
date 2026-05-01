'use client';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MobileNav from '@/components/layout/MobileNav';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFF9F5] text-[#111] flex overflow-x-hidden">
        {/* Global Fixed Navigation */}
        <Sidebar />
        <Header />
        
        <main className="flex-1 min-h-screen relative pt-16 md:ml-20">
          <div className="w-full h-full overflow-y-auto">
            {children}
          </div>
        </main>
        
        {/* Mobile Fixed Nav (Bottom) */}
        <MobileNav />
      </div>
    </ProtectedRoute>
  );
}