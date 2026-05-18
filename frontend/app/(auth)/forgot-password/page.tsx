'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CaretLeft, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react';
import { AuthHeader } from '@/components/layout/AuthHeader';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'sent' | 'reset' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('sent');
    }, 1500);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col">
      <AuthHeader />

      <main className="flex-1 flex items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] p-10 shadow-sm"
        >
          {step === 'request' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-1 text-[12px] font-bold text-[#6B7280] hover:text-[#006D32] transition-colors mb-4"
                >
                  <CaretLeft size={14} weight="bold" />
                  Back to Sign In
                </Link>
                <h1 className="text-3xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                  Forgot Password?
                </h1>
                <p className="text-[#6B7280] text-sm leading-relaxed">
                  No worries, it happens. Enter your email and we'll send you a recovery link to reset your account.
                </p>
              </div>

              <form onSubmit={handleRequest} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#0B1C30]">Email Address</label>
                  <div className="relative">
                    <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium focus:ring-2 focus:ring-[#006D32]/20 focus:border-[#006D32] outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#006D32] text-white rounded-xl font-bold text-base hover:bg-[#005227] transition-all shadow-lg shadow-green-900/10 active:scale-95 disabled:opacity-50"
                  style={{ fontFamily: "'Space Grotesk'" }}
                >
                  {loading ? 'Sending Link...' : 'Send Recovery Link'}
                </button>
              </form>
            </div>
          )}

          {step === 'sent' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-[#EFF4FF] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} weight="fill" className="text-[#006D32]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Check Your Email</h2>
                <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs mx-auto">
                  We've sent a password recovery link to <span className="text-[#0B1C30] font-bold">{email}</span>.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Demo Simulator</p>
                <button 
                  onClick={() => setStep('reset')}
                  className="w-full py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                >
                  Simulate: Click Recovery Link
                </button>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => setStep('request')}
                  className="text-sm font-bold text-[#006D32] hover:underline"
                >
                  Didn't get the email? Try again
                </button>
                <Link 
                  href="/login" 
                  className="text-sm font-bold text-[#6B7280] hover:text-[#0B1C30]"
                >
                  Back to login
                </Link>
              </div>
            </motion.div>
          )}

          {step === 'reset' && (
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                  Set New Password
                </h1>
                <p className="text-[#6B7280] text-sm leading-relaxed">
                  Your identity has been verified. Choose a secure new password for your account.
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#0B1C30]">New Password</label>
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium focus:ring-2 focus:ring-[#006D32]/20 focus:border-[#006D32] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#0B1C30]">Confirm Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-3.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium focus:ring-2 focus:ring-[#006D32]/20 focus:border-[#006D32] outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#006D32] text-white rounded-xl font-bold text-base hover:bg-[#005227] transition-all shadow-lg shadow-green-900/10 active:scale-95 disabled:opacity-50"
                  style={{ fontFamily: "'Space Grotesk'" }}
                >
                  {loading ? 'Resetting...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {step === 'success' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-[#F0FDF4] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} weight="fill" className="text-[#006D32]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>Password Updated</h2>
                <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs mx-auto">
                  Your password has been successfully reset. You can now sign in with your new credentials.
                </p>
              </div>

              <div className="pt-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center w-full py-4 bg-[#0B1C30] text-white rounded-xl font-bold text-base hover:bg-[#1a2e45] transition-all"
                  style={{ fontFamily: "'Space Grotesk'" }}
                >
                  Back to Sign In
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
