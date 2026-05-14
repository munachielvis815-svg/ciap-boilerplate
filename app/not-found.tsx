'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, House } from '@phosphor-icons/react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F9FF] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Large 404 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[140px] font-black text-[#0B1C30] leading-none mb-4 tracking-[-6px]"
          style={{ fontFamily: "'Space Grotesk'" }}
        >
          404
        </motion.div>

        <h2 className="text-4xl font-bold text-[#0B1C30] mb-4" style={{ fontFamily: "'Space Grotesk'" }}>
          Page Not Found
        </h2>

        <p className="text-[#6B7280] text-lg mb-10 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#006D32] text-white font-bold rounded-2xl hover:bg-[#005227] transition-all text-lg"
              style={{ fontFamily: "'Space Grotesk'" }}
            >
              <House size={24} weight="bold" />
              Back to Home
            </motion.button>
          </Link>

          <Link href="/dashboard">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-8 py-4 border-2 border-[#E5E7EB] text-[#0B1C30] font-bold rounded-2xl hover:border-[#006D32] transition-all text-lg"
              style={{ fontFamily: "'Space Grotesk'" }}
            >
              <ArrowLeft size={24} weight="bold" />
              Go to Dashboard
            </motion.button>
          </Link>
        </div>

        {/* Subtle illustration */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-[#E5E7EB] text-8xl"
        >
          🔍
        </motion.div>
      </div>
    </div>
  );
}