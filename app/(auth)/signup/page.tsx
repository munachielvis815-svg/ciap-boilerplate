"use client";
import { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
// rely on backend-set httpOnly cookies for persistence
import { getPostLoginRoute } from '@/lib/auth/routes';
import { toast } from 'sonner';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'creator' | 'sme'>('creator');
  const [showSocial, setShowSocial] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(
        '/auth/signup',
        { email, name, password, role },
        { withCredentials: true }
      );
      // rely on backend-set httpOnly cookies for persistence
      useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome to domiron, ${data.user.name}! 🎉`);
      
      const target = getPostLoginRoute(data.user.role);
      router.replace(target);
    } catch (err: any) {
      const rawMsg = err?.response?.data?.message;
      const errorMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || err.message || 'Signup failed');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-white font-sans overflow-hidden relative">
      
      {/* 2/3 Area Visual */}
      <div className="hidden lg:block w-[66.6%] h-full relative overflow-hidden border-r-2 border-black/10">
        <Image
          src="/backdrop.jpg"
          alt="Backdrop"
          fill
          priority
          quality={42}
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
        />
      </div>

      {/* 1/3 Area Content */}
      <div className="w-full lg:w-[33.3%] h-full flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-white">
        
        <div className="absolute inset-0 z-0">
          <Image
            src="/backdrop.jpg"
            alt="Backdrop"
            fill
            quality={30}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-white/35 backdrop-blur-sm" />
        </div>

        {/* The 'Sweet' Slim Card - Aggressively Compact Style */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-[92%] max-w-[340px] md:max-w-[310px] bg-white border-1 border-black rounded-[2.1rem] overflow-hidden shadow-2xl shadow-black/5"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F472B6] via-[#60A5FA] to-[#FDE047]" />
          
          {/* Subtle Background Art */}
          <div className="absolute inset-0 z-0 opacity-[0.08] blur-[1px] pointer-events-none flex items-center justify-center overflow-hidden">
             <img src="/undraw_document-analysis_3c0y.svg" alt="" className="w-[150%] max-w-none grayscale" />
          </div>

          <div className="relative z-10 px-6 pt-10 pb-6 md:px-8 md:pt-8 md:pb-5 flex flex-col items-center">
            
            {/* Header Content - Super Tight */}
            <div className="w-full mb-5 md:mb-4">
               <h1 className="text-[28px] md:text-[24px] leading-[0.9] font-black tracking-tighter text-[#111] font-[family-name:var(--font-bricolage)]">
                 Sign Up Now
               </h1>
            </div>

            {/* Role Selection - "Exactly like the reference" Vibe */}
            <div className="flex justify-center gap-4 mb-6 md:mb-5 w-full">
               <label className="cursor-pointer group relative">
                  <input 
                    type="radio" 
                    name="role" 
                    className="sr-only peer" 
                    checked={role === 'creator'} 
                    onChange={() => setRole('creator')} 
                  />
                  <div className={`
                    w-[80px] h-[80px] flex flex-col items-center justify-center rounded-2xl border-2 transition-all relative
                    ${role === 'creator' ? 'border-[#F472B6] text-[#F472B6]' : 'border-[#b5bfd9] bg-white hover:border-[#F472B6]'}
                  `}>
                    {/* Top-left Indicator Dot */}
                    <div className={`
                      absolute top-1.5 left-1.5 w-2 h-2 rounded-full border-1 border-[#b5bfd9] transition-all
                      ${role === 'creator' ? 'scale-100 opacity-100 bg-[#F472B6] border-[#F472B6]' : 'scale-0 opacity-0 bg-white group-hover:scale-100 group-hover:opacity-100'}
                    `} />
                    
                    <div className="mb-1 pointer-events-none">
                       <img src="/undraw_video-influencer_7ak0.svg" alt="" className={`w-10 h-auto transition-all ${role === 'creator' ? 'opacity-100' : 'opacity-40'}`} />
                    </div>
                    <span className={`text-[11px] font-bold transition-all ${role === 'creator' ? 'text-[#F472B6]' : 'text-zinc-400'}`}>Creator</span>
                  </div>
               </label>

               <label className="cursor-pointer group relative">
                  <input 
                    type="radio" 
                    name="role" 
                    className="sr-only peer" 
                    checked={role === 'sme'} 
                    onChange={() => setRole('sme')} 
                  />
                  <div className={`
                    w-[80px] h-[80px] flex flex-col items-center justify-center rounded-2xl border-2 transition-all relative
                    ${role === 'sme' ? 'border-[#60A5FA] text-[#60A5FA]' : 'border-[#b5bfd9] bg-white hover:border-[#60A5FA]'}
                  `}>
                    {/* Top-left Indicator Dot */}
                    <div className={`
                      absolute top-1.5 left-1.5 w-2 h-2 rounded-full border-1 border-[#b5bfd9] transition-all
                      ${role === 'sme' ? 'scale-100 opacity-100 bg-[#60A5FA] border-[#60A5FA]' : 'scale-0 opacity-0 bg-white group-hover:scale-100 group-hover:opacity-100'}
                    `} />
                    
                    <div className="mb-1 pointer-events-none">
                       <img src="/undraw_revenue_kv38.svg" alt="" className={`w-10 h-auto transition-all ${role === 'sme' ? 'opacity-100' : 'opacity-40'}`} />
                    </div>
                    <span className={`text-[11px] font-bold transition-all ${role === 'sme' ? 'text-[#60A5FA]' : 'text-zinc-400'}`}>SME</span>
                  </div>
               </label>
            </div>

            <form className="w-full flex flex-col" onSubmit={handleSignup}>
              
              <div className="space-y-2 mb-6 md:mb-4">
                <input 
                  type="text" 
                  placeholder="Your name"
                  className="w-full px-5 py-3 md:py-2.5 rounded-2xl border-1 border-black bg-zinc-50/20 text-black text-sm md:text-[13px] font-medium focus:outline-none focus:bg-white transition-all placeholder:text-zinc-400"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {name.length > 0 && name.trim().length < 2 && (
                  <p className="text-[11px] text-red-400 font-medium pl-2">Name must be at least 2 characters</p>
                )}
                <input 
                  type="email" 
                  placeholder="Email address"
                  className="w-full px-5 py-3 md:py-2.5 rounded-2xl border-1 border-black bg-zinc-50/20 text-black text-sm md:text-[13px] font-medium focus:outline-none focus:bg-white transition-all placeholder:text-zinc-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {/* Password with peek toggle */}
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min. 8 characters)"
                    className="w-full px-5 py-3 md:py-2.5 pr-12 rounded-2xl border-1 border-black bg-zinc-50/20 text-black text-sm md:text-[13px] font-medium focus:outline-none focus:bg-white transition-all placeholder:text-zinc-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    )}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-[11px] text-red-400 font-medium pl-2">Password must be at least 8 characters ({password.length}/8)</p>
                )}
              </div>

              <div className="flex flex-col gap-3 md:gap-2.5">
                 <button
                   type="submit"
                   disabled={loading}
                   className="w-full py-4.5 md:py-3.5 rounded-full bg-black text-white font-bold text-lg md:text-base transition-all active:scale-[0.98] disabled:opacity-60"
                 >
                   {loading ? 'Creating account...' : 'Sign up'}
                 </button>
                 
                 <div className="flex items-center gap-3 w-full my-0.5 md:my-0">
                    <button 
                      type="button" 
                      onClick={() => setShowSocial(!showSocial)}
                      className="w-full py-1 text-[10px] md:text-[9px] font-bold text-zinc-400 hover:text-black transition-all"
                    >
                      {showSocial ? 'Less social' : 'Social entry'}
                    </button>
                 </div>

                 <AnimatePresence>
                   {showSocial && (
                     <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mb-2">
                        <button type="button" className="w-full py-3.5 md:py-2.5 rounded-full border-1 border-black bg-white text-black text-xs md:text-[11px] font-bold flex items-center justify-center gap-2.5 transition-all hover:bg-zinc-50">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.27c0-.85-.08-1.67-.21-2.47H12v4.67h6.46a5.53 5.53 0 01-2.4 3.63v3.02h3.89c2.28-2.1 3.57-5.2 3.57-8.85z" fill="#4285F4"/><path fillRule="evenodd" clipRule="evenodd" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3.02c-1.08.73-2.46 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.96 11.96 0 0012 24z" fill="#34A853"/><path fillRule="evenodd" clipRule="evenodd" d="M5.27 14.27a7.22 7.22 0 010-4.54V6.63H1.26A11.97 11.97 0 000 12c0 1.92.45 3.73 1.26 5.37l4.01-3.1z" fill="#FBBC05"/><path fillRule="evenodd" clipRule="evenodd" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.44C17.96 1.21 15.24 0 12 0 7.42 0 3.33 2.6 1.26 6.63l4.01 3.1c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335"/></svg>
                          Google Sign in
                        </button>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              <div className="mt-4 pt-4 border-t border-black/5 text-center">
                 <p className="text-xs md:text-[11px] text-zinc-400 font-medium tracking-tight">
                   Already have an account? <Link href="/login" className="text-black font-bold border-b border-black/10 hover:border-black transition-all pb-0.5 ml-1">Log in</Link>
                 </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

    </div>
  );
}