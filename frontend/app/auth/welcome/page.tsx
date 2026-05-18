'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import { useMeProfile } from '@/lib/api/hooks';
import { CheckCircle } from '@phosphor-icons/react';

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: profile } = useMeProfile();
  const [isVisible, setIsVisible] = useState(true);

  const displayName = profile?.profile?.displayName || profile?.profile?.name || user?.name || 'there';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col items-center justify-center px-4">
      {/* Animated Success Checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isVisible ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-[#006D32]/10 rounded-full flex items-center justify-center">
          <CheckCircle size={96} weight="fill" className="text-[#006D32]" />
        </div>
      </motion.div>

      {/* Success Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0B1C30] mb-4 text-center px-4"
        style={{
          fontFamily: "'Space Grotesk'",
          letterSpacing: '-1.8px',
        }}
      >
        Welcome, {displayName}!
      </motion.h1>

      {/* Success Message */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-lg sm:text-xl text-[#6B7280] max-w-md text-center mb-12"
        style={{ fontFamily: "'Inter'" }}
      >
        Your account has been verified. Redirecting you to the dashboard...
      </motion.p>

      {/* Loading Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isVisible ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex gap-2"
      >
        {[0, 1, 2].map((idx) => (
          <motion.div
            key={idx}
            animate={{ y: [-8, 0, -8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: idx * 0.2,
            }}
            className="w-3 h-3 bg-[#006D32] rounded-full"
          />
        ))}
      </motion.div>
    </div>
  );
}
