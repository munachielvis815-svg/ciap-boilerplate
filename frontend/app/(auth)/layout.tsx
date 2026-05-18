'use client';
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Simplified layout: the pages will handle their own split-screen and backdrop logic.
  return (
    <div className="min-h-screen w-full bg-white font-sans selection:bg-black selection:text-white overflow-x-hidden relative">
      {children}
    </div>
  );
}
