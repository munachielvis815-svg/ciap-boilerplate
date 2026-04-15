import { motion } from "framer-motion";
import { User, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8f9fa]">
      <div className="w-full max-w-sm flex flex-col items-center space-y-12">
        {/* Logo Placeholder */}
        <div className="wf-box w-20 h-20 rounded-2xl shadow-sm">
           <Image
            src="/icons/icon-192x192.png"
            alt="30 Cycle Logo"
            width={60}
            height={60}
            className="z-10"
          />
        </div>

        {/* Title Group */}
        <div className="w-full space-y-4 text-center">
          <div className="wf-text h-8 w-3/4 mx-auto mb-2 opacity-50" />
          <div className="wf-text h-4 w-1/2 mx-auto opacity-30" />
        </div>

        {/* Form Skeleton */}
        <div className="w-full bg-white border-2 border-[#DEE2E6] rounded-[2rem] p-8 space-y-8 shadow-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="wf-text h-3 w-1/4 mb-1" />
              <div className="wf-box h-12 rounded-xl" />
            </div>
            
            <Link href="/onboarding" className="block">
              <div className="bg-blue-600 h-14 rounded-xl flex items-center justify-center text-white font-bold cursor-pointer hover:bg-blue-500 transition-colors">
                Continue
              </div>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#DEE2E6]"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-muted-foreground font-mono">Or</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="wf-box h-12 rounded-xl" />
            <div className="wf-box h-12 rounded-xl" />
          </div>
        </div>

        {/* Footer Mocks */}
        <div className="flex gap-8 justify-center opacity-20">
          <div className="wf-dot w-6 h-6" />
          <div className="wf-dot w-6 h-6" />
          <div className="wf-dot w-6 h-6" />
        </div>
      </div>
    </main>
  );
}
