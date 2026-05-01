'use client';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { forwardRef, ReactNode } from 'react';

interface CardProps extends HTMLMotionProps<"div"> {
  children?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.05)" }}
        className={cn(
          "glass-panel-light rounded-[2.5rem] p-8 relative overflow-hidden transition-all duration-300",
          className
        )}
        {...props}
      >
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    );
  }
);

Card.displayName = "Card";
export default Card;