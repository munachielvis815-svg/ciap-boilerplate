'use client';
import Sidebar from '@/app/(protected)/dashboard/Sidebar';
import Header from '@/app/(protected)/dashboard/Header';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import MobileNav from '@/components/layout/MobileNav';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFF9F5] text-[#111] flex overflow-x-hidden">
        {/* Global Fixed Navigation */}
        {/* <Sidebar />
        <Header /> */}

        <main className="flex-1 relative pt-20 md:pt-16 md:ml-20">
          {children}
        </main>

        {/* Mobile Fixed Nav (Bottom) */}
        <MobileNav />
      </div>
    </ProtectedRoute>
  );
}