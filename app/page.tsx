'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0); 
  const router = useRouter();

  const nextStep = () => {
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    } else {
      router.push('/login');
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const skipToLogin = () => {
    router.push('/login');
  };

  const slides = [
    {
      title: "Unified\nAnalytics",
      img: "/undraw_document-analysis_3c0y.svg",
      bgColor: "bg-[#FDF2F8]"
    },
    {
      title: "Platform\nInsights",
      img: "/undraw_connected-world_anke.svg",
      bgColor: "bg-[#F0F9FF]"
    },
    {
      title: "Creator\nDiscovery",
      img: "/undraw_around-the-world_vgcy.svg",
      bgColor: "bg-[#FEFCE8]"
    },
    {
      title: "Campaign\nROI",
      img: "/undraw_revenue_kv38.svg",
      bgColor: "bg-[#F0FDF4]"
    }
  ];

  const current = slides[step];

  const textVariants = {
    initial: (direction: number) => ({
      y: direction > 0 ? 20 : -20,
      opacity: 0,
      filter: 'blur(10px)',
    }),
    animate: {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -20 : 20,
      opacity: 0,
      filter: 'blur(10px)',
    })
  };

  const imageVariants = {
    initial: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.9,
      rotate: direction > 0 ? 5 : -5
    }),
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotate: 0,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.9,
      rotate: direction > 0 ? -5 : 5
    })
  };

  const floatAnimation = {
    float: {
      y: [0, -15, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut" as const
      }
    }
  };

  return (
    <div className={`h-screen w-full ${current.bgColor} font-sans flex items-center justify-center transition-colors duration-1000 overflow-hidden relative`}>
      
      {/* Top Nav - Persistent */}
      <div className="fixed top-6 left-6 md:top-10 md:left-10 z-50">
        <AnimatePresence>
          {step > 0 && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevStep}
              className="px-6 py-2.5 rounded-full bg-white/80 backdrop-blur-md border-2 border-black text-[#111] font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] group"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="transition-transform group-hover:-translate-x-0.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              PREV
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-7xl h-full flex items-center justify-center p-8 md:pt-16 md:px-16 md:pb-[50px] relative">
        
        {/* Core Layout */}
        <div className="w-full h-full flex flex-col md:grid md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16 items-center justify-center relative">
          
          {/* 1. Visual Block - ABOVE text on mobile, RIGHT on desktop */}
          <div className="w-full order-1 md:order-2 md:col-start-2 md:row-span-2 h-auto md:h-full flex items-center justify-center md:justify-end py-10 md:py-0">
             <AnimatePresence mode="wait" custom={direction}>
                <motion.div 
                  key={step}
                  custom={direction}
                  variants={imageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.1 }}
                  className="relative w-full max-w-[232px] md:max-w-none md:w-[110%] flex items-center justify-center"
                >
                  <motion.div variants={floatAnimation} animate="float">
                    <img
                      src={current.img}
                      alt="Visual"
                      loading={step === 0 ? 'eager' : 'lazy'}
                      className="w-full h-auto max-h-[37vh] md:max-h-[65vh] object-contain pointer-events-none"
                    />
                  </motion.div>
                </motion.div>
             </AnimatePresence>
          </div>

          {/* 2. Title Block - MIDDLE on mobile, LEFT on desktop */}
          <div className="w-full order-2 md:order-1 md:col-start-1 md:row-start-1 h-[160px] md:h-[300px] flex flex-col items-center md:items-start text-center md:text-left justify-center px-4 md:px-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.h1 
                key={step}
                custom={direction}
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="text-[64px] md:text-[72px] lg:text-[88px] xl:text-[96px] leading-[0.85] font-black tracking-tighter text-[#111] font-[family-name:var(--font-bricolage)]"
              >
                {current.title.split('\n').map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </motion.h1>
            </AnimatePresence>
          </div>

          {/* 3. Controls Block */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full order-3 md:order-3 md:col-start-1 md:row-start-2 h-auto mt-4 md:-mt-24 flex flex-col items-center md:items-start gap-8 md:gap-10 justify-center md:justify-start"
          >
             {/* Indicators */}
             <div className="flex gap-3">
                {[0,1,2,3].map(i => (
                   <motion.div 
                     key={i} 
                     layout
                     initial={false}
                     animate={{
                       width: step === i ? 48 : 12,
                       backgroundColor: step === i ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.1)'
                     }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     className="h-3 rounded-full border border-black/5" 
                   />
                ))}
             </div>

             <div className="flex flex-col items-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep} 
                  className="group relative w-72 md:w-[240px] px-8 py-5 rounded-[1.25rem] bg-black text-white font-black text-xl transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <span className="relative z-10 font-[family-name:var(--font-bricolage)] tracking-tight">
                    {step === 3 ? 'Get Started' : 'Next Step'}
                  </span>
                </motion.button>
                
                <motion.button 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={skipToLogin}
                  className="text-zinc-500 font-black text-sm hover:text-black transition-all cursor-pointer border-b-2 border-transparent hover:border-black tracking-widest uppercase"
                >
                  Skip
                </motion.button>
             </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
