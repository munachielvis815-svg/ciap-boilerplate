'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import api from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { getPostLoginRoute } from '@/lib/auth/routes';
import { toast } from 'sonner';
import { AuthHeader } from '@/components/layout/AuthHeader';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col">
      <AuthHeader />

      {/* Main Content - Centered Form */}
      <main className="flex-1 pt-24 px-4 sm:px-8 lg:px-[60px] py-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm"
        >
            
            {/* Header Content */}
            <div className="w-full mb-8">
               <h1 className="text-3xl leading-tight font-black text-[#0B1C30] mb-2" style={{ fontFamily: "'Space Grotesk'" }}>
                 {isAdminLogin ? 'Admin Access' : 'Sign In'}
               </h1>
               <p className="text-[#6B7280] text-sm" style={{ fontFamily: "'Inter'" }}>Continue to your Omniview dashboard</p>
               {!isAdminLogin && (
                 <button 
                   type="button"
                   onClick={() => setIsAdminLogin(!isAdminLogin)}
                   className="mt-3 text-xs font-bold text-[#6B61F0] hover:text-[#5951D8] transition-colors border-b border-[#6B61F0] hover:border-[#5951D8]"
                 >
                   Admin Login?
                 </button>
               )}
               {isAdminLogin && (
                 <button 
                   type="button"
                   onClick={() => setIsAdminLogin(!isAdminLogin)}
                   className="mt-3 text-xs font-bold text-[#6B61F0] hover:text-[#5951D8] transition-colors border-b border-[#6B61F0] hover:border-[#5951D8]"
                 >
                   User Login?
                 </button>
               )}
            </div>

            <form
              className="w-full flex flex-col"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                try {
                  const endpoint = isAdminLogin ? '/auth/admin/login' : '/auth/login';
                  const { data } = await api.post(endpoint, { email, password }, { withCredentials: true });
                  // rely on backend-set httpOnly cookies for persistence
                  useAuthStore.getState().setAuth(data.user, data.accessToken, data.refreshToken);
                  toast.success(`Welcome back, ${data.user.name}!`);
                  
                  // Use router.replace now that ProtectedRoute handles hydration correctly
                  const target = getPostLoginRoute(data.user.role);
                  router.replace(target);
                } catch (err) {
                  // Handle different error types safely
                  const error = err as Record<string, unknown> | Error;
                  let message = 'Login failed';
                  
                  if (error instanceof Error) {
                    message = error.message;
                  } else if (typeof error === 'object' && error !== null && 'response' in error) {
                    const response = (error.response as Record<string, unknown>) || {};
                    const errorData = (response.data as Record<string, unknown>) || {};
                    const msg = errorData.message;
                    if (Array.isArray(msg)) {
                      message = (msg as string[]).join(', ');
                    } else if (typeof msg === 'string') {
                      message = msg;
                    }
                  }
                  
                  toast.error(message);
                } finally {
                  setLoading(false);
                }
              }}
            >
              
              <div className="space-y-4 mb-2">
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
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-[#0B1C30]">Password</label>
                    <Link href="/forgot-password" className="text-xs font-bold text-[#6B61F0] hover:underline">Forgot password?</Link>
                  </div>    <div className="relative">
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
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-6">
                 <button
                   type="submit"
                   disabled={loading}
                   className="w-full py-3 rounded-lg bg-[#006D32] text-white font-bold text-base transition-all hover:bg-[#005227] active:scale-[0.98] disabled:opacity-60"
                   style={{ fontFamily: "'Space Grotesk'" }}
                 >
                   {loading ? 'Signing in...' : 'Sign In'}
                 </button>
                 
                 {!isAdminLogin && (
                   <>
                     <div className="flex items-center gap-3 w-full">
                        <div className="flex-1 h-px bg-[#E5E7EB]" />
                        <span className="text-xs font-medium text-[#9CA3AF]">Or</span>
                        <div className="flex-1 h-px bg-[#E5E7EB]" />
                     </div>

                     <button 
                       type="button" 
                       onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/google`}
                       className="w-full py-3 rounded-lg border border-[#E5E7EB] bg-white text-[#0B1C30] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-[#F8F9FF] active:scale-[0.98]"
                     >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M23.52 12.27c0-.85-.08-1.67-.21-2.47H12v4.67h6.46a5.53 5.53 0 01-2.4 3.63v3.02h3.89c2.28-2.1 3.57-5.2 3.57-8.85z" fill="#4285F4"/><path fillRule="evenodd" clipRule="evenodd" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-3.02c-1.08.73-2.46 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.1A11.96 11.96 0 0012 24z" fill="#34A853"/><path fillRule="evenodd" clipRule="evenodd" d="M5.27 14.27a7.22 7.22 0 010-4.54V6.63H1.26A11.97 11.97 0 000 12c0 1.92.45 3.73 1.26 5.37l4.01-3.1z" fill="#FBBC05"/><path fillRule="evenodd" clipRule="evenodd" d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.43-3.44C17.96 1.21 15.24 0 12 0 7.42 0 3.33 2.6 1.26 6.63l4.01 3.1c.95-2.85 3.6-4.96 6.73-4.96z" fill="#EA4335"/></svg>
                        Continue with Google
                     </button>
                   </>
                 )}
              </div>

              {!isAdminLogin && (
                <div className="text-center border-t border-[#E5E7EB] pt-6">
                   <p className="text-sm text-[#6B7280] font-medium">
                     Don&apos;t have an account? <Link href="/signup" className="text-[#6B61F0] font-bold hover:text-[#5951D8] transition-colors">Sign up free</Link>
                   </p>
                </div>
              )}
            </form>
        </motion.div>
      </main>
    </div>
  );
}