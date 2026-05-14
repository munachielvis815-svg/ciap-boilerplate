// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { useRouter } from "next/navigation";
// import api from '@/lib/api/client';
// import { useAuthStore } from '@/lib/auth/store';
// import { toast } from 'sonner';
// import { AuthHeader } from '@/components/layout/AuthHeader';

// export default function Signup() {
//   const router = useRouter();
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [role, setRole] = useState<'creator' | 'sme'>('creator');
//   const [loading, setLoading] = useState(false);

//   const handleSignup = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Client-side validation
//     if (name.trim().length < 2) {
//       toast.error('Name must be at least 2 characters.');
//       return;
//     }
//     if (password.length < 8) {
//       toast.error('Password must be at least 8 characters.');
//       return;
//     }

//     setLoading(true);
//     try {
//       const { data } = await api.post(
//         '/auth/signup',
//         { email, name, password, role },
//         { withCredentials: true }
//       );
//       // rely on backend-set httpOnly cookies for persistence
//       useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
//       toast.success(`Welcome to Omniview, ${data.user.name}! 🎉`);
      
//       // Redirect to welcome page for smooth transition
//       router.replace('/auth/welcome');
//     } catch (err: unknown) {
//       const error = err as { response?: { data?: { message?: string | string[] } } } | Error;
//       const rawMsg = error && 'response' in error ? error.response?.data?.message : undefined;
//       const errorMsg = Array.isArray(rawMsg) ? rawMsg.join(', ') : (rawMsg || ('message' in error ? error.message : 'Signup failed'));
//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-gradient-to-br from-[#F8F9FF] via-white to-[#F0F4FF] font-sans flex flex-col">
//       <AuthHeader />
//       <div className="flex-1 flex lg:flex-row">
      
//       {/* 2/3 Area Visual - Gradient Background */}
//       <div className="hidden lg:flex w-[66.6%] relative overflow-hidden items-center justify-center pt-20">
//         <div className="absolute inset-0 bg-gradient-to-br from-[#6B61F0]/10 via-transparent to-[#10B981]/10"></div>
//         <motion.div
//           animate={{ y: [0, -20, 0] }}
//           transition={{ duration: 6, repeat: Infinity }}
//           className="text-center z-10"
//         >
//           <div className="text-7xl mb-6">🚀</div>
//           <h1 className="text-5xl font-bold text-[#0B1C30] mb-4">Start Your Journey<br/>with <span className="text-[#6B61F0]">Omniview</span></h1>
//           <p className="text-lg text-[#6B7280] max-w-md">Join 50,000+ creators optimizing their intelligence</p>
//         </motion.div>
//       </div>

//       {/* 1/3 Area Content */}
//       <div className="w-full lg:w-[33.3%] flex items-center justify-center p-4 md:p-6 relative pt-20 pb-20">

//         {/* The Omniview Signup Card */}
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//           className="relative z-10 w-full max-w-[420px] bg-white rounded-2xl overflow-hidden shadow-xl"
//         >
//           <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6B61F0] to-[#10B981]" />
          
//           {/* Subtle Background Art */}
//           <div className="absolute inset-0 z-0 opacity-[0.03] blur-[1px] pointer-events-none flex items-center justify-center overflow-hidden">
//              <div className="text-8xl">✨</div>
//           </div>

//           <div className="relative z-10 px-8 pt-8 pb-10 flex flex-col items-start">
            
//             {/* Header Content */}
//             <div className="w-full mb-8">
//                <h1 className="text-3xl leading-tight font-bold text-[#0B1C30] font-[family-name:var(--font-bricolage)]">
//                  Create Account
//                </h1>
//                <p className="text-[#6B7280] text-sm mt-2">Join Omniview and command your digital presence</p>
//             </div>

//             {/* Role Selection */}
//             <div className="flex gap-4 mb-8 w-full">
//                <label className="flex-1 cursor-pointer group">
//                   <input 
//                     type="radio" 
//                     name="role" 
//                     className="sr-only peer" 
//                     checked={role === 'creator'} 
//                     onChange={() => setRole('creator')} 
//                   />
//                   <div className={`
//                     w-full flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all
//                     ${role === 'creator' ? 'border-[#6B61F0] bg-[#F0F4FF]' : 'border-[#E5E7EB] bg-white hover:border-[#6B61F0]'}
//                   `}>
//                     <div className="text-2xl mb-2">👨‍🎬</div>
//                     <span className={`text-xs font-bold transition-all ${role === 'creator' ? 'text-[#6B61F0]' : 'text-[#6B7280]'}`}>Creator</span>
//                   </div>
//                </label>

//                <label className="flex-1 cursor-pointer group">
//                   <input 
//                     type="radio" 
//                     name="role" 
//                     className="sr-only peer" 
//                     checked={role === 'sme'} 
//                     onChange={() => setRole('sme')} 
//                   />
//                   <div className={`
//                     w-full flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all
//                     ${role === 'sme' ? 'border-[#10B981] bg-[#F0FDF4]' : 'border-[#E5E7EB] bg-white hover:border-[#10B981]'}
//                   `}>
//                     <div className="text-2xl mb-2">🏢</div>
//                     <span className={`text-xs font-bold transition-all ${role === 'sme' ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>Business</span>
//                   </div>
//                </label>
//             </div>

//             <form className="w-full flex flex-col" onSubmit={handleSignup}>
              
//               <div className="space-y-4 mb-6">
//                 <div>
//                   <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Full Name</label>
//                   <input 
//                     type="text" 
//                     placeholder="John Doe"
//                     className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-medium focus:outline-none focus:border-[#6B61F0] focus:ring-2 focus:ring-[#6B61F0]/20 transition-all placeholder:text-[#9CA3AF]"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                     required
//                   />
//                   {name.length > 0 && name.trim().length < 2 && (
//                     <p className="text-xs text-[#EF4444] font-medium pl-2 mt-1">Name must be at least 2 characters</p>
//                   )}
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Email</label>
//                   <input 
//                     type="email" 
//                     placeholder="you@example.com"
//                     className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-medium focus:outline-none focus:border-[#6B61F0] focus:ring-2 focus:ring-[#6B61F0]/20 transition-all placeholder:text-[#9CA3AF]"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Password</label>
//                   <div className="relative">
//                     <input 
//                       type={showPassword ? 'text' : 'password'}
//                       placeholder="••••••••"
//                       className="w-full px-4 py-3 pr-12 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-medium focus:outline-none focus:border-[#6B61F0] focus:ring-2 focus:ring-[#6B61F0]/20 transition-all placeholder:text-[#9CA3AF]"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       required
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B61F0] transition-colors p-1"
//                       aria-label={showPassword ? 'Hide password' : 'Show password'}
//                     >
//                       {showPassword ? (
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
//                       ) : (
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
//                       )}
//                     </button>
//                   </div>
//                   {password.length > 0 && password.length < 8 && (
//                     <p className="text-xs text-[#EF4444] font-medium pl-2 mt-1">Password must be at least 8 characters ({password.length}/8)</p>
//                   )}
//                 </div>
//               </div>

//               <div className="flex flex-col gap-3">
//                  <button
//                    type="submit"
//                    disabled={loading}
//                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[#6B61F0] to-[#10B981] text-white font-bold text-base transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
//                  >
//                    {loading ? 'Creating account...' : 'Sign Up'}
//                  </button>
                 
//                  <button type="button" className="w-full py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-[#F8F9FF] active:scale-[0.98]">
//                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.27c0-.85-.08-1.67-.21-2.47H12v4.67h6.46a5.53 5.53 0 01-2.4 3.63v3.02h3.89c2.28-2.1 3.57-5.2 3.57-8.85z" fill="#4285F4"/><path fillRule="evenodd" clipRule="evenodd" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3.02c-1.08.73-2.46 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.96 11.96 0 0012 24z" fill="#34A853"/><path fillRule="evenodd" clipRule="evenodd" d="M5.27 14.27a7.22 7.22 0 010-4.54V6.63H1.26A11.97 11.97 0 000 12c0 1.92.45 3.73 1.26 5.37l4.01-3.1z" fill="#FBBC05"/><path fillRule="evenodd" clipRule="evenodd" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.44C17.96 1.21 15.24 0 12 0 7.42 0 3.33 2.6 1.26 6.63l4.01 3.1c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335"/></svg>
//                     Continue with Google
//                  </button>
//               </div>

//               <div className="text-center border-t border-[#E5E7EB] pt-6 mt-6">
//                  <p className="text-sm text-[#6B7280] font-medium">
//                    Already have an account? <Link href="/login" className="text-[#6B61F0] font-bold hover:text-[#5951D8] transition-colors">Sign in</Link>
//                  </p>
//               </div>
//             </form>
//           </div>
//         </motion.div>
//       </div>
//       </div>
//     </div>
//   );
// }

'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, User, Building } from '@phosphor-icons/react';
import api from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { toast } from 'sonner';
import { AuthHeader } from '@/components/layout/AuthHeader';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'creator' | 'sme'>('creator');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation (from your old code)
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

      useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome to Omniview, ${data.user.name}!`);
      router.replace('/auth/welcome');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Signup failed';
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col">
      <AuthHeader />

      <main className="flex-1 pt-24 px-4 sm:px-8 lg:px-[60px] py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm"
        >
          {/* Header */}
          <div className="w-full mb-8">
            <h1 className="text-3xl leading-tight font-black text-[#0B1C30] mb-2" style={{ fontFamily: "'Space Grotesk'" }}>
              Create Account
            </h1>
            <p className="text-[#6B7280] text-sm" style={{ fontFamily: "'Inter'" }}>
              Join Omniview and command your digital presence
            </p>
          </div>

          <form className="w-full flex flex-col" onSubmit={handleSignup}>
            {/* Role Selection */}
            <div className="flex gap-4 mb-8">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="role" className="sr-only peer" checked={role === 'creator'} onChange={() => setRole('creator')} />
                <div className={`w-full flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${role === 'creator' ? 'border-[#6B61F0] bg-[#F0F4FF]' : 'border-[#E5E7EB] hover:border-[#6B61F0]'}`}>
                  <User size={32} weight="bold" className={`mb-2 ${role === 'creator' ? 'text-[#6B61F0]' : 'text-[#6B7280]'}`} />
                  <span className={`text-xs font-bold ${role === 'creator' ? 'text-[#6B61F0]' : 'text-[#6B7280]'}`}>Creator</span>
                </div>
              </label>

              <label className="flex-1 cursor-pointer">
                <input type="radio" name="role" className="sr-only peer" checked={role === 'sme'} onChange={() => setRole('sme')} />
                <div className={`w-full flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${role === 'sme' ? 'border-[#10B981] bg-[#F0FDF4]' : 'border-[#E5E7EB] hover:border-[#10B981]'}`}>
                  <Building size={32} weight="bold" className={`mb-2 ${role === 'sme' ? 'text-[#10B981]' : 'text-[#6B7280]'}`} />
                  <span className={`text-xs font-bold ${role === 'sme' ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>Business</span>
                </div>
              </label>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-medium focus:outline-none focus:border-[#6B61F0] focus:ring-2 focus:ring-[#6B61F0]/20 transition-all placeholder:text-[#9CA3AF]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Email</label>
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-medium focus:outline-none focus:border-[#6B61F0] focus:ring-2 focus:ring-[#6B61F0]/20 transition-all placeholder:text-[#9CA3AF]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#0B1C30] mb-2">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-medium focus:outline-none focus:border-[#6B61F0] focus:ring-2 focus:ring-[#6B61F0]/20 transition-all placeholder:text-[#9CA3AF]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B61F0] transition-colors p-1"
                  >
                    {showPassword ? <Eye size={20} weight="bold" /> : <EyeSlash size={20} weight="bold" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#006D32] text-white font-bold text-base transition-all hover:bg-[#005227] active:scale-[0.98] disabled:opacity-60"
              style={{ fontFamily: "'Space Grotesk'" }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="text-center border-t border-[#E5E7EB] pt-6 mt-6">
              <p className="text-sm text-[#6B7280] font-medium">
                Already have an account?{' '}
                <Link href="/login" className="text-[#6B61F0] font-bold hover:text-[#5951D8] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}