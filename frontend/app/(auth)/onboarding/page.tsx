// // 'use client';
// // import { useState } from 'react';
// // import { motion, AnimatePresence } from 'framer-motion';
// // import { useRouter } from 'next/navigation';
// // import { TrendUp, Target, ArrowRight, CaretLeft } from '@phosphor-icons/react';

// // const slides = [
// //   {
// //     badge: 'WELCOME',
// //     title: 'Welcome to Omniview',
// //     description: 'Your command center for creator intelligence. Harness cross-platform analytics and AI-driven scoring to transform raw engagement into strategic growth.',
// //     icon: null,
// //   },
// //   {
// //     badge: 'FEATURE #1',
// //     title: 'Real-time Analytics',
// //     description: 'Live-streaming data across Twitch, YouTube, and TikTok synchronized into a single, high-fidelity command center. Track velocity, reach, and engagement in real-time.',
// //     icon: TrendUp,
// //   },
// //   {
// //     badge: 'FEATURE #2',
// //     title: 'Influence Scoring',
// //     description: 'Our proprietary AI calculates your "Market Gravity" on a 0-100 scale. Understand your true influence beyond vanity metrics.',
// //     icon: Target,
// //   },
// //   {
// //     badge: 'READY?',
// //     title: 'Smart Discovery',
// //     description: 'Find collaborators that match your audience DNA. No more vanity metrics—just raw synergy and proven engagement patterns.',
// //     icon: null,
// //   },
// // ];

// // export default function OnboardingPage() {
// //   const router = useRouter();
// //   const [currentSlide, setCurrentSlide] = useState(0);

// //   const handleNext = () => {
// //     if (currentSlide < slides.length - 1) {
// //       setCurrentSlide(currentSlide + 1);
// //     } else {
// //       router.push('/signup');
// //     }
// //   };

// //   const handlePrev = () => {
// //     if (currentSlide > 0) {
// //       setCurrentSlide(currentSlide - 1);
// //     }
// //   };

// //   const currentSlideData = slides[currentSlide];
// //   const Icon = currentSlideData.icon;

// //   return (
// //     <div className="min-h-screen bg-[#F8F9FF] flex flex-col">
// //       {/* Header with bottom border */}
// //       <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F9FF]/80 backdrop-blur-sm border-b border-[#E5E7EB]">
// //         <div className="px-4 sm:px-8 lg:px-[60px] py-4 flex items-center justify-between">
// //           {/* Logo */}
// //           <svg width="40" height="16" viewBox="0 0 165 70" fill="none" xmlns="http://www.w3.org/2000/svg">
// //             <path d="M61.0599 8.22729L57.3961 5.81219L53.7322 3.3971L61.0599 0.982003V8.22729Z" fill="#6B61F0"/>
// //             <path d="M19.5363 50.4914L29.3066 36.0009L34.1917 39.6235L57.3961 5.81219M57.3961 5.81219L61.0599 8.22729V0.982003L53.7322 3.3971L57.3961 5.81219Z" stroke="#6B61F0" strokeWidth="1.42062"/>
// //             <path d="M34.1966 29.9562H9.77095C9.77095 29.9562 13.4348 23.3696 17.0986 20.735C20.7625 18.1003 26.8689 15.4657 26.8689 15.4657L34.1966 29.9562Z" fill="#6B61F0"/>
// //             <path d="M24.1458 32.0116L11.8558 53.3251C11.8558 53.3251 8.3103 47.0901 7.9982 42.6779C7.68611 38.2657 8.60301 31.7222 8.60301 31.7222L24.1458 32.0116Z" fill="#6B61F0"/>
// //             <path d="M21.2924 42.0373L34.5956 62.7475C34.5956 62.7475 27.3637 62.9294 23.2736 61.1382C19.1836 59.347 13.7632 55.4848 13.7632 55.4848L21.2924 42.0373Z" fill="#6B61F0"/>
// //             <path d="M29.3092 47.853L54.1033 46.8872C54.1033 46.8872 50.6284 53.1609 47.0069 55.7573C43.3855 58.3537 37.2846 61.0466 37.2846 61.0466L29.3092 47.853Z" fill="#6B61F0"/>
// //             <path d="M39.0784 44.4323L50.6557 22.7322C50.6557 22.7322 54.4059 28.849 54.8639 33.2488C55.322 37.6485 54.6224 44.2182 54.6224 44.2182L39.0784 44.4323Z" fill="#6B61F0"/>
// //           </svg>

// //           {/* Progress Indicator - Desktop */}
// //           <div className="hidden sm:flex gap-2">
// //             {slides.map((_, idx) => (
// //               <button
// //                 key={idx}
// //                 onClick={() => setCurrentSlide(idx)}
// //                 className={`h-2 rounded-full transition-all ${
// //                   idx === currentSlide ? 'w-8 bg-[#006D32]' : 'w-2 bg-[#E5E7EB]'
// //                 }`}
// //               />
// //             ))}
// //           </div>

// //           {/* Step Counter */}
// //           <div className="text-sm font-bold text-[#6B7280]" style={{ fontFamily: "'Space Grotesk'" }}>
// //             {currentSlide + 1} / {slides.length}
// //           </div>
// //         </div>
// //       </header>

// //       {/* Main Content */}
// //       <main className="flex-1 pt-24 px-4 sm:px-8 lg:px-[60px] pb-40 sm:pb-24 flex items-center">
// //         <AnimatePresence mode="wait">
// //           <motion.div
// //             key={currentSlide}
// //             initial={{ opacity: 0, y: 20 }}
// //             animate={{ opacity: 1, y: 0 }}
// //             exit={{ opacity: 0, y: -20 }}
// //             transition={{ duration: 0.4 }}
// //             className="w-full max-w-3xl mx-auto"
// //           >
// //             {/* Badge */}
// //             <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#64FF92] rounded-full text-xs font-bold tracking-wider text-[#003D1A] mb-6">
// //               <span className="inline-block w-2 h-2 bg-[#006D32] rounded-full"></span>
// //               {currentSlideData.badge}
// //             </div>

// //             {/* Title */}
// //             <h1
// //               className="text-5xl sm:text-6xl lg:text-[72px] font-black text-[#0B1C30] mb-6 leading-tight"
// //               style={{
// //                 fontFamily: "'Space Grotesk'",
// //                 letterSpacing: '-1.8px',
// //                 lineHeight: '72px',
// //               }}
// //             >
// //               {currentSlideData.title}
// //             </h1>

// //             {/* Description */}
// //             <p className="text-lg sm:text-xl text-[#6B7280] max-w-2xl mb-12 leading-relaxed" style={{ fontFamily: "'Inter'" }}>
// //               {currentSlideData.description}
// //             </p>

// //             {/* Icon Display */}
// //             {Icon && (
// //               <motion.div
// //                 initial={{ opacity: 0, scale: 0.9 }}
// //                 animate={{ opacity: 1, scale: 1 }}
// //                 transition={{ delay: 0.2, duration: 0.4 }}
// //                 className="flex justify-start mb-12"
// //               >
// //                 <div className="w-24 h-24 bg-[#EDF5F0] rounded-2xl flex items-center justify-center">
// //                   <Icon size={64} weight="bold" className="text-[#006D32]" />
// //                 </div>
// //               </motion.div>
// //             )}
// //           </motion.div>
// //         </AnimatePresence>
// //       </main>

// //       {/* Desktop Footer Navigation */}
// //       <footer className="hidden sm:block fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 sm:px-8 lg:px-[60px] py-6">
// //         <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
// //           <motion.button
// //             whileHover={{ scale: 1.02 }}
// //             onClick={handlePrev}
// //             disabled={currentSlide === 0}
// //             className="px-6 py-3 border-2 border-[#E5E7EB] text-[#0B1C30] font-bold rounded-lg hover:border-[#006D32] disabled:opacity-30 disabled:cursor-not-allowed transition"
// //             style={{ fontFamily: "'Space Grotesk'" }}
// //           >
// //             ← Back
// //           </motion.button>

// //           <motion.button
// //             whileHover={{ scale: 1.02 }}
// //             onClick={handleNext}
// //             className="px-6 py-3 bg-[#006D32] text-white font-bold rounded-lg hover:bg-[#005227] transition flex items-center gap-2"
// //             style={{ fontFamily: "'Space Grotesk'" }}
// //           >
// //             {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
// //             <ArrowRight size={20} weight="bold" />
// //           </motion.button>
// //         </div>
// //       </footer>

// //       {/* Mobile Bottom Navigation */}
// //       <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] px-4 py-4">
// //         <div className="flex items-center justify-between gap-3">
// //           <button
// //             onClick={handlePrev}
// //             disabled={currentSlide === 0}
// //             className="flex-1 px-3 py-2 border border-[#E5E7EB] text-[#0B1C30] font-bold rounded-lg disabled:opacity-30 flex items-center justify-center"
// //             style={{ fontFamily: "'Space Grotesk'" }}
// //           >
// //             <CaretLeft size={20} weight="bold" />
// //           </button>

// //           <div className="flex-1 flex gap-2 justify-center">
// //             {slides.map((_, idx) => (
// //               <button
// //                 key={idx}
// //                 onClick={() => setCurrentSlide(idx)}
// //                 className={`h-2 rounded-full transition-all ${
// //                   idx === currentSlide ? 'w-6 bg-[#006D32]' : 'w-2 bg-[#E5E7EB]'
// //                 }`}
// //               />
// //             ))}
// //           </div>

// //           <button
// //             onClick={handleNext}
// //             className="flex-1 px-3 py-2 bg-[#006D32] text-white font-bold rounded-lg flex items-center justify-center"
// //             style={{ fontFamily: "'Space Grotesk'" }}
// //           >
// //             <ArrowRight size={20} weight="bold" />
// //           </button>
// //         </div>
// //       </nav>
// //     </div>
// //   );
// // }



// 'use client';
// import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useRouter } from 'next/navigation';
// import { TrendUp, Target, UsersThree, ArrowRight, CaretLeft, ArrowLeft } from '@phosphor-icons/react';
// import Image from 'next/image';

// const slides = [
//   {
//     badge: "WELCOME",
//     title: "Welcome to Omniview",
//     description: "Your Resource Intelligence for the Creator Economy.",
//     visual: "hero",
//   },
//   {
//     badge: "REAL-TIME",
//     title: "Real-time Analytics",
//     description: "Live-streaming data across Twitch, YouTube, and TikTok synchronized into a single, high-fidelity command center.",
//     icon: TrendUp,
//     color: "#006D32",
//   },
//   {
//     badge: "INFLUENCE",
//     title: "Influence Scoring",
//     description: 'Our proprietary AI calculates your "Market Gravity" on a 0-100 scale.',
//     icon: Target,
//     color: "#6B61F0",
//   },
//   {
//     badge: "DISCOVERY",
//     title: "Smart Discovery",
//     description: "Find collaborators that actually match your audience DNA. No more vanity metrics—just raw synergy.",
//     icon: UsersThree,
//     color: "#00D166",
//   },
// ];

// export default function OnboardingPage() {
//   const router = useRouter();
//   const [currentSlide, setCurrentSlide] = useState(0);

//   const current = slides[currentSlide];
//   const Icon = current.icon;

//   const handleNext = () => {
//     if (currentSlide < slides.length - 1) {
//       setCurrentSlide(currentSlide + 1);
//     } else {
//       router.push('/signup');
//     }
//   };

//   const handlePrev = () => {
//     if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
//   };

//   return (
//     <div className="min-h-screen bg-[#F8F9FF] flex flex-col">
//       {/* Header */}
//       <header className="fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-md bg-[#F8F9FF]/80 border-b border-[#E5E7EB]">
//         <div className="max-w-7xl mx-auto px-6 lg:px-[60px] h-full flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             {/* Small Logo */}
//             <div className="w-8 h-8 bg-[#6B61F0] rounded-full flex items-center justify-center">
//               <span className="text-white text-xl font-bold">O</span>
//             </div>
//             <span className="font-bold text-xl text-[#0B1C30]">Omniview</span>
//           </div>

//           <div className="flex items-center gap-8">
//             <div className="hidden sm:flex gap-2">
//               {slides.map((_, i) => (
//                 <button
//                   key={i}
//                   onClick={() => setCurrentSlide(i)}
//                   className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-8 bg-[#006D32]' : 'w-2 bg-[#E5E7EB]'}`}
//                 />
//               ))}
//             </div>
//             <span className="text-sm font-medium text-[#6B7280]">
//               {currentSlide + 1} / {slides.length}
//             </span>
//           </div>
//         </div>
//       </header>

//       <main className="flex-1 pt-28 pb-24 flex items-center">
//         <div className="max-w-5xl mx-auto px-6 w-full">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={currentSlide}
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -30 }}
//               transition={{ duration: 0.5 }}
//               className="grid lg:grid-cols-2 gap-12 items-center"
//             >
//               {/* Left - Content */}
//               <div className="space-y-8">
//                 <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#64FF92] rounded-full text-sm font-bold tracking-widest text-[#00210B]">
//                   {current.badge}
//                 </div>

//                 <h1 className="text-5xl lg:text-6xl font-black leading-tight text-[#0B1C30]" style={{ fontFamily: "'Space Grotesk'" }}>
//                   {current.title}
//                 </h1>

//                 <p className="text-lg text-[#3C4A3D] max-w-lg" style={{ fontFamily: "'Inter'" }}>
//                   {current.description}
//                 </p>

//                 {currentSlide === slides.length - 1 && (
//                   <motion.button
//                     whileHover={{ scale: 1.05 }}
//                     onClick={() => router.push('/signup')}
//                     className="inline-flex items-center gap-3 bg-[#006D32] text-white px-8 py-4 rounded-2xl font-bold text-lg"
//                   >
//                     Get Started Free
//                     <ArrowRight weight="bold" size={24} />
//                   </motion.button>
//                 )}
//               </div>

//               {/* Right - Visual */}
//               <div className="flex justify-center lg:justify-end">
//                 <div className="relative w-full max-w-md aspect-square bg-white rounded-3xl shadow-xl overflow-hidden border border-[#E5E7EB]">
//                   {Icon ? (
//                     <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F8F9FF] to-white">
//                       <Icon size={180} weight="duotone" className="text-[#006D32]/10" />
//                       <Icon size={120} weight="bold" className="absolute text-[#006D32]" />
//                     </div>
//                   ) : (
//                     <div className="w-full h-full bg-gradient-to-br from-[#64FF92]/10 to-[#006D32]/10 flex items-center justify-center">
//                       <div className="text-[180px] opacity-10">🚀</div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </motion.div>
//           </AnimatePresence>
//         </div>
//       </main>

//       {/* Navigation */}
//       <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
//         <motion.button
//           whileHover={{ scale: 1.1 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={handlePrev}
//           disabled={currentSlide === 0}
//           className="w-14 h-14 rounded-2xl border border-[#E5E7EB] bg-white flex items-center justify-center disabled:opacity-40"
//         >
//           <ArrowLeft size={24} weight="bold" />
//         </motion.button>

//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={handleNext}
//           className="px-10 h-14 rounded-2xl bg-[#006D32] text-white font-bold flex items-center gap-3"
//         >
//           {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
//           <ArrowRight size={22} weight="bold" />
//         </motion.button>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';

const slides = [
  {
    badge: "WELCOME",
    title: "Welcome to Omniview",
    description: "Your Resource Intelligence for the Creator Economy.",
    illustration: "/undraw_connected-world_anke.svg",
  },
  {
    badge: "REAL-TIME",
    title: "Real-time Analytics",
    description: "Live-streaming data across Twitch, YouTube, and TikTok synchronized into a single, high-fidelity command center.",
    illustration: "/undraw_video-streaming_cckz.svg",
  },
  {
    badge: "INFLUENCE",
    title: "Influence Scoring",
    description: 'Our proprietary AI calculates your "Market Gravity" on a 0-100 scale.',
    illustration: "/undraw_gravitas_ger1.svg",
  },
  {
    badge: "DISCOVERY",
    title: "Smart Discovery",
    description: "Find collaborators that actually match your audience DNA. No more vanity metrics—just raw synergy.",
    illustration: "/undraw_online-community_3o0l.svg",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const current = slides[currentSlide];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/signup');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] flex flex-col">
      {/* === HEADER WITH PROGRESS === */}
      <header className="fixed top-0 left-0 right-0 z-50 h-20 backdrop-blur-md bg-[#F8F9FF]/80 border-b border-[#0B1C30]/10">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-[116px] h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
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
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-8">
            <div className="hidden sm:flex items-center gap-3">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentSlide 
                      ? 'w-10 bg-[#006D32]' 
                      : 'w-2 bg-[#E5E7EB] hover:bg-[#CBD5E1]'
                  }`}
                />
              ))}
            </div>

            <div className="text-sm font-semibold text-[#6B7280] tabular-nums">
              {currentSlide + 1} / {slides.length}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20 pb-32 flex items-center">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#64FF92] rounded-full text-sm font-bold tracking-widest text-[#00210B]">
                  {current.badge}
                </div>

                <h1 
                  className="text-5xl lg:text-6xl font-black leading-[1.08] text-[#0B1C30]"
                  style={{ fontFamily: "'Space Grotesk'" }}
                >
                  {current.title}
                </h1>

                <p 
                  className="text-lg text-[#374151] max-w-lg leading-relaxed"
                  style={{ fontFamily: "'Inter'" }}
                >
                  {current.description}
                </p>
              </div>

              {/* Illustration */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[520px] aspect-square">
                  <Image
                    src={current.illustration}
                    alt={current.title}
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Classy Navigation Buttons */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl border border-[#E5E7EB] bg-white text-[#0B1C30] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#CBD5E1] transition-all duration-200"
        >
          <ArrowLeft size={22} weight="bold" />
          <span>Back</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleNext}
          className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#006D32] hover:bg-[#005227] text-white font-semibold shadow-lg shadow-[#006D32]/30 transition-all duration-200"
        >
          <span>
            {currentSlide === slides.length - 1 ? "Get Started Free" : "Continue"}
          </span>
          <ArrowRight size={22} weight="bold" />
        </motion.button>
      </div>
    </div>
  );
}