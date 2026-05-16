'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function InfluenceScore({ score = 85 }: { score?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = mounted ? circumference - (score / 100) * circumference : circumference;

  return (
    <motion.div
       animate={{ scale: [1, 1.02, 1] }}
       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
       className="relative flex items-center justify-center p-6"
    >
       <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
          <defs>
             <linearGradient id="pastelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F472B6" /> {/* Pink */}
                <stop offset="100%" stopColor="#A855F7" /> {/* Purple */}
             </linearGradient>
          </defs>
          
          {/* Background Track */}
          <circle
             cx="110" cy="110" r={radius}
             fill="none"
             stroke="#F3F4F6"
             strokeWidth="24"
          />
          
          {/* Animated Solid Line */}
          <motion.circle
             cx="110" cy="110" r={radius}
             fill="none"
             stroke="url(#pastelGradient)"
             strokeWidth="24"
             strokeLinecap="round"
             initial={{ strokeDashoffset: circumference }}
             animate={{ strokeDashoffset }}
             transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
             style={{ strokeDasharray: circumference }}
          />
       </svg>

       {/* Score Text */}
       <div className="absolute flex flex-col items-center justify-center pointer-events-none mt-2">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-6xl font-bold tracking-tighter text-[#0A0A0A]"
          >
            {mounted ? score : 0}
          </motion.span>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-1"
          >
            Core Score
          </motion.span>
       </div>
    </motion.div>
  );
}
