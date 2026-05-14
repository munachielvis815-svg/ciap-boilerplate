'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, TrendUp, Target } from '@phosphor-icons/react';
import Image from 'next/image'
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Space Grotesk, Inter, sans-serif" }}>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-md bg-[#F8F9FF]/80 border-b border-[#0B1C30]/10">
        <div className="max-w-[1280px] mx-auto px-[116px] h-full flex items-center">
          <div className="flex items-center gap-2.5">
            <svg width="165" height="70" viewBox="0 0 165 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M61.0599 8.22729L57.3961 5.81219L53.7322 3.3971L61.0599 0.982003V8.22729Z" fill="#6B61F0"/>
              <path d="M19.5363 50.4914L29.3066 36.0009L34.1917 39.6235L57.3961 5.81219M57.3961 5.81219L61.0599 8.22729V0.982003L53.7322 3.3971L57.3961 5.81219Z" stroke="#6B61F0" strokeWidth="1.42062"/>
              <path d="M34.1966 29.9562H9.77095C9.77095 29.9562 13.4348 23.3696 17.0986 20.735C20.7625 18.1003 26.8689 15.4657 26.8689 15.4657L34.1966 29.9562Z" fill="#6B61F0"/>
              <path d="M24.1458 32.0116L11.8558 53.3251C11.8558 53.3251 8.3103 47.0901 7.9982 42.6779C7.68611 38.2657 8.60301 31.7222 8.60301 31.7222L24.1458 32.0116Z" fill="#6B61F0"/>
              <path d="M21.2924 42.0373L34.5956 62.7475C34.5956 62.7475 27.3637 62.9294 23.2736 61.1382C19.1836 59.347 13.7632 55.4848 13.7632 55.4848L21.2924 42.0373Z" fill="#6B61F0"/>
              <path d="M29.3092 47.853L54.1033 46.8872C54.1033 46.8872 50.6284 53.1609 47.0069 55.7573C43.3855 58.3537 37.2846 61.0466 37.2846 61.0466L29.3092 47.853Z" fill="#6B61F0"/>
              <path d="M39.0784 44.4323L50.6557 22.7322C50.6557 22.7322 54.4059 28.849 54.8639 33.2488C55.322 37.6485 54.6224 44.2182 54.6224 44.2182L39.0784 44.4323Z" fill="#6B61F0"/>
              <path d="M79.4866 42.762C77.7266 42.762 76.3266 42.2787 75.2866 41.312C74.2466 40.3453 73.7266 38.962 73.7266 37.162V33.802C73.7266 32.002 74.2466 30.6187 75.2866 29.652C76.3266 28.6853 77.7266 28.202 79.4866 28.202C81.2466 28.202 82.6466 28.6853 83.6866 29.652C84.7266 30.6187 85.2466 32.002 85.2466 33.802V37.162C85.2466 38.962 84.7266 40.3453 83.6866 41.312C82.6466 42.2787 81.2466 42.762 79.4866 42.762ZM79.4866 40.402C80.4732 40.402 81.2399 40.1153 81.7866 39.542C82.3332 38.9687 82.6066 38.202 82.6066 37.242V33.722C82.6066 32.762 82.3332 31.9953 81.7866 31.422C81.2399 30.8487 80.4732 30.562 79.4866 30.562C78.5132 30.562 77.7499 30.8487 77.1966 31.422C76.6432 31.9953 76.3666 32.762 76.3666 33.722V37.242C76.3666 38.202 76.6432 38.9687 77.1966 39.542C77.7499 40.1153 78.5132 40.402 79.4866 40.402ZM87.6466 42.482V32.562H90.1266V33.642H90.4866C90.6599 33.3087 90.9466 33.0187 91.3466 32.772C91.7466 32.5253 92.2732 32.402 92.9266 32.402C93.6332 32.402 94.1999 32.5387 94.6266 32.812C95.0532 33.0853 95.3799 33.442 95.6066 33.882H95.9666C96.1932 33.4553 96.5132 33.102 96.9266 32.822C97.3399 32.542 97.9266 32.402 98.6866 32.402C99.2999 32.402 99.8566 32.532 100.357 32.792C100.857 33.052 101.257 33.4453 101.557 33.972C101.857 34.4987 102.007 35.162 102.007 35.962V42.482H99.4866V36.142C99.4866 35.5953 99.3466 35.1853 99.0666 34.912C98.7866 34.6387 98.3932 34.502 97.8866 34.502C97.3132 34.502 96.8699 34.6853 96.5566 35.052C96.2432 35.4187 96.0866 35.942 96.0866 36.622V42.482H93.5666V36.142C93.5666 35.5953 93.4266 35.1853 93.1466 34.912C92.8666 34.6387 92.4732 34.502 91.9666 34.502C91.3932 34.502 90.9499 34.6853 90.6366 35.052C90.3232 35.4187 90.1666 35.942 90.1666 36.622V42.482H87.6466ZM104.727 42.482V32.562H107.207V33.862H107.567C107.727 33.5153 108.027 33.1853 108.467 32.872C108.907 32.5587 109.573 32.402 110.467 32.402C111.24 32.402 111.917 32.5787 112.497 32.932C113.077 33.2853 113.527 33.772 113.847 34.392C114.167 35.012 114.327 35.7353 114.327 36.562V42.482H111.807V36.762C111.807 36.0153 111.623 35.4553 111.257 35.082C110.89 34.7087 110.367 34.522 109.687 34.522C108.913 34.522 108.313 34.7787 107.887 35.292C107.46 35.8053 107.247 36.522 107.247 37.442V42.482H104.727ZM117.047 42.482V32.562H119.567V42.482H117.047ZM118.307 31.402C117.853 31.402 117.47 31.2553 117.157 30.962C116.843 30.6687 116.687 30.282 116.687 29.802C116.687 29.322 116.843 28.9353 117.157 28.642C117.47 28.3487 117.853 28.202 118.307 28.202C118.773 28.202 119.16 28.3487 119.467 28.642C119.773 28.9353 119.927 29.322 119.927 29.802C119.927 30.282 119.773 30.6687 119.467 30.962C119.16 31.2553 118.773 31.402 118.307 31.402ZM124.447 42.482L121.287 32.562H123.967L126.267 40.642H126.627L128.927 32.562H131.607L128.447 42.482H124.447ZM133.327 42.482V32.562H135.847V42.482H133.327ZM134.587 31.402C134.133 31.402 133.75 31.2553 133.437 30.962C133.123 30.6687 132.967 30.282 132.967 29.802C132.967 29.322 133.123 28.9353 133.437 28.642C133.75 28.3487 134.133 28.202 134.587 28.202C135.053 28.202 135.44 28.3487 135.747 28.642C136.053 28.9353 136.207 29.322 136.207 29.802C136.207 30.282 136.053 30.6687 135.747 30.962C135.44 31.2553 135.053 31.402 134.587 31.402ZM143.167 42.762C142.18 42.762 141.31 42.552 140.557 42.132C139.803 41.712 139.217 41.1187 138.797 40.352C138.377 39.5853 138.167 38.682 138.167 37.642V37.402C138.167 36.362 138.373 35.4587 138.787 34.692C139.2 33.9253 139.78 33.332 140.527 32.912C141.273 32.492 142.14 32.282 143.127 32.282C144.1 32.282 144.947 32.4987 145.667 32.932C146.387 33.3653 146.947 33.9653 147.347 34.732C147.747 35.4987 147.947 36.3887 147.947 37.402V38.262H140.727C140.753 38.942 141.007 39.4953 141.487 39.922C141.967 40.3487 142.553 40.562 143.247 40.562C143.953 40.562 144.473 40.4087 144.807 40.102C145.14 39.7953 145.393 39.4553 145.567 39.082L147.627 40.162C147.44 40.5087 147.17 40.8853 146.817 41.292C146.463 41.6987 145.993 42.0453 145.407 42.332C144.82 42.6187 144.073 42.762 143.167 42.762ZM140.747 36.382H145.387C145.333 35.8087 145.103 35.3487 144.697 35.002C144.29 34.6553 143.76 34.482 143.107 34.482C142.427 34.482 141.887 34.6553 141.487 35.002C141.087 35.3487 140.84 35.8087 140.747 36.382ZM150.947 42.482L149.547 32.562H152.047L152.927 40.782H153.287L154.567 32.562H158.607L159.887 40.782H160.247L161.127 32.562H163.627L162.227 42.482H158.047L156.767 34.262H156.407L155.127 42.482H150.947Z" fill="#0B1C30"/>
            </svg>
          </div>
        </div>
      </header>

      {/* Hero Section */}
       <section className="pt-24 sm:pt-32 px-4 sm:px-8 lg:px-[60px] py-12 sm:py-16">
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
           {/* Left Content */}
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#64FF92] rounded-full text-xs font-bold tracking-wider text-[#003D1A]">
              THE LUMINOUS ENGINE
            </div>

            {/* Heading */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-5xl font-black text-[#0B1C30] leading-tight" style={{ fontFamily: "\"Space Grotesk\"" }}>
                Your Resource Intelligence for the
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-5xl font-black leading-tight" style={{
                fontFamily: "\"Space Grotesk\"",
                background: "linear-gradient(to right, #00D166, #00D166)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}>
                Creator Economy.
              </h1>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-md" style={{ fontFamily: "\"Inter\"" }}>
              Omniview unifies your digital footprint. Harness cross-platform analytics and AI-driven scoring to transform raw engagement into strategic growth.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push('/onboarding')}
                className="px-6 py-3 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition"
                style={{ fontFamily: "\"Space Grotesk\"" }}
              >
                Get Started
              </motion.button>
             <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => router.push('/onboarding')}
                className="px-6 py-3 border-2 border-[#E5E7EB] text-[#0B1C30] font-bold rounded-lg hover:border-[#006D32] transition"
                style={{ fontFamily: "\"Space Grotesk\"" }}
              >
                Watch Demo
              </motion.button>
            </div>
          </motion.div>

          {/* Right - Metrics Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-xl">
              <div className="space-y-8">
                <h3 className="text-lg font-bold text-[#0B1C30]" style={{ fontFamily: "\"Space Grotesk\"" }}>
                  Pulse Monitoring
                </h3>

                {/* Progress Bars */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-[#006D32] rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-[#0059BB] rounded-full"></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-[#00D166] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#F3F4F6] rounded-lg p-4">
                    <p className="text-xs font-bold text-[#6B7280] tracking-wide" style={{ fontFamily: "\"Inter\"" }}>Velocity</p>
                    <p className="text-2xl font-bold text-[#006D32] mt-2" style={{ fontFamily: "\"Space Grotesk\"" }}>+24.8%</p>
                  </div>
                  <div className="bg-[#F3F4F6] rounded-lg p-4">
                    <p className="text-xs font-bold text-[#6B7280] tracking-wide" style={{ fontFamily: "\"Inter\"" }}>Reach</p>
                    <p className="text-2xl font-bold text-[#0059BB] mt-2" style={{ fontFamily: "\"Space Grotesk\"" }}>1.2M</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#EFF4FF] px-4 sm:px-8 lg:px-[60px] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 lg:mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-[#0B1C30] mb-4" style={{ fontFamily: "\"Space Grotesk\"" }}>
              Engineered for Impact
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl" style={{ fontFamily: "\"Inter\"" }}>
              Break free from fragmented data. Omniview provides the structural clarity required to scale in a decentralized world.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Real-time Analytics - Takes 2 cols on desktop */}
            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm"
            >
              <div className="flex gap-4 mb-8">
                <div className="w-12 h-12 bg-[#EDF5F0] rounded-lg flex items-center justify-center text-[#006D32]">
                  <TrendUp size={24} weight="bold" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
                    Real-time Analytics
                  </h3>
                  <p className="text-base text-[#6B7280] mt-2" style={{ fontFamily: "'Inter'" }}>
                    Live-streaming data across Twitch, YouTube, and TikTok synchronized into a single, high-fidelity command center.
                  </p>
                </div>
              </div>
              <Image
                src="/Background.png"
                alt="Real-time Analytics Dashboard"
                width={800}
                height={224}
                className="w-full h-56 object-cover rounded-xl"
              />
            </motion.div>

            {/* Influence Scoring */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-[#EEF2FF] rounded-full flex items-center justify-center text-[#0059BB] mb-6">
                <Target size={32} weight="bold" />
              </div>
              <h3 className="text-2xl font-black text-[#0B1C30] mb-3" style={{ fontFamily: "'Space Grotesk'" }}>
                Influence Scoring
              </h3>
              <p className="text-base text-[#6B7280] mb-8" style={{ fontFamily: "'Inter'" }}>
                Our proprietary AI calculates your &quot;Market Gravity&quot; on a 0-100 scale.
              </p>

              {/* Circular Score */}
              <div className="w-40 h-40 relative flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    fill="none"
                    stroke="#00D166"
                    strokeWidth="8"
                    strokeDasharray={`${70 * Math.PI * 1.5} ${70 * Math.PI * 2}`}
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-black text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>84</span>
                  <span className="text-xs font-bold text-[#6B7280] tracking-wide">Score</span>
                </div>
              </div>
            </motion.div>

            {/* Smart Discovery */}
<div className="lg:col-span-3 mt-4 bg-[#006D32] rounded-3xl p-12 text-white relative overflow-hidden">
  <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
    
    {/* Text Content */}
    <div>
      <h3 className="text-4xl font-bold leading-tight mb-6">Smart Discovery</h3>
      <p className="text-[17px] text-white/90 mb-8 max-w-md">
        Find collaborators that actually match your audience DNA. No more vanity metrics—just raw synergy and proven engagement patterns.
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        className="inline-flex items-center gap-3 bg-[#64FF92] text-[#003D1A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-colors"
      >
        Explore Creators
        <ArrowRight weight="bold" size={22} />
      </motion.button>
    </div>

    {/* Cards Container */}
    <div className="hidden lg:block relative w-full h-[196px]">
      {/* Left Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute left-0 top-0 w-[244px] h-[196px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl"
        style={{ transform: 'rotate(2deg)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-full" />
          <div className="h-2.5 bg-white/30 rounded-full flex-1" />
        </div>
        <div className="h-[108px] bg-white/10 rounded-xl" />
      </motion.div>

      {/* Right Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="absolute right-0 top-4 w-[244px] h-[196px] bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-xl"
        style={{ transform: 'rotate(-3deg)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-white rounded-full" />
          <div className="h-2.5 bg-white/30 rounded-full flex-1" />
        </div>
        <div className="h-[108px] bg-white/10 rounded-xl" />
      </motion.div>
    </div>
  </div>
</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-[116px] bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-[#0B1C30] mb-4">
            Ready to command your digital footprint?
          </h2>
          <p className="text-lg text-[#6B7280] mb-8">
            Join 50,000+ top-tier creators using Omniview to scale their intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
  {/* App Store Button */}
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-900 transition inline-flex items-center gap-3 justify-center cursor-pointer"
    style={{ fontFamily: "'Space Grotesk'" }}
  >
    <FaApple size={28} />
    <div className="text-left">
      <div className="text-xs opacity-70 -mb-0.5">Coming Soon</div>
      <div>App Store</div>
    </div>
  </motion.div>

  {/* Google Play Button */}
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-900 transition inline-flex items-center gap-3 justify-center cursor-pointer"
    style={{ fontFamily: "'Space Grotesk'" }}
  >
    <FaGooglePlay size={26} />
    <div className="text-left">
      <div className="text-xs opacity-70 -mb-0.5">Coming Soon</div>
      <div>Google Play</div>
    </div>
  </motion.div>
</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F9FAFB] border-t border-[#E5E7EB] px-4 sm:px-8 lg:px-[60px] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-black text-[#0B1C30] mb-4" style={{ fontFamily: "'Space Grotesk'" }}>
                Omniview
              </h4>
              <p className="text-sm text-[#6B7280]" style={{ fontFamily: "'Inter'" }}>
                Intelligence infrastructure for the next generation of creative capital.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-[#0B1C30] mb-4" style={{ fontFamily: "'Space Grotesk'" }}>Product</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]" style={{ fontFamily: "'Inter'" }}>
                <li><a href="#" className="hover:text-[#0B1C30]">Analytics Engine</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Scoring Model</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Discovery API</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#0B1C30] mb-4" style={{ fontFamily: "'Space Grotesk'" }}>Resources</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]" style={{ fontFamily: "'Inter'" }}>
                <li><a href="#" className="hover:text-[#0B1C30]">Documentation</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Creator Guides</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Community</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#0B1C30] mb-4" style={{ fontFamily: "'Space Grotesk'" }}>Company</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]" style={{ fontFamily: "'Inter'" }}>
                <li><a href="#" className="hover:text-[#0B1C30]">About Us</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Careers</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Legal</a></li>
                <li><a href="#" className="hover:text-[#0B1C30]">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#E5E7EB] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6B7280]" style={{ fontFamily: "'Inter'" }}>
            <p>© 2025 Omniview. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[#0B1C30]">Twitter</a>
              <a href="#" className="hover:text-[#0B1C30]">GitHub</a>
              <a href="#" className="hover:text-[#0B1C30]">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
