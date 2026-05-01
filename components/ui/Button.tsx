'use client';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export default function Button({ 
  children, 
  className, 
  ...props 
}: HTMLMotionProps<"button">) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative px-8 py-4 rounded-full font-bold text-base overflow-hidden flex items-center justify-center gap-2",
        "bg-white border border-[#0A0A0A] text-[#0A0A0A] transition-colors duration-200 shadow-sm",
        "hover:bg-[#F9FAFB]",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}