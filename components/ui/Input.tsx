import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-6 py-4 rounded-full text-base outline-none transition-all duration-300",
        "bg-white border border-zinc-200 text-[#0A0A0A] placeholder:text-zinc-500",
        "focus:border-[#A855F7] focus:ring-2 focus:ring-[#A855F7]/20 shadow-sm",
        className
      )}
      {...props}
    />
  );
}