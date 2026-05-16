'use client';
import { motion } from 'framer-motion';

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => {
    const delay = 1 + i * 0.5;
    return {
      pathLength: 1,
      opacity: 1,
    };
  }
};

export const GraphicInfluence = () => (
  <motion.svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    initial="hidden"
    animate="visible"
    className="overflow-visible"
  >
    {/* Abstract geometric 'Influence' representation (like the abstract art shapes) */}
    <circle cx="50" cy="50" r="40" stroke="#E5E7EB" strokeWidth="2" fill="none" />
    <motion.circle
      cx="50" cy="50" r="40"
      stroke="#18181B"
      strokeWidth="2"
      fill="none"
      variants={draw}
      custom={0}
      transition={{ pathLength: { delay: 1, type: "spring", duration: 1.5, bounce: 0 }, opacity: { delay: 1, duration: 0.01 } }}
      className="drop-shadow-sm"
    />
    <motion.path
      d="M30 50 L45 65 L70 35"
      stroke="#FACC15"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      variants={draw}
      custom={1}
      transition={{ pathLength: { delay: 1.5, type: "spring", duration: 1.5, bounce: 0 }, opacity: { delay: 1.5, duration: 0.01 } }}
    />
    {/* Accent geometric dot */}
    <motion.circle
      cx="70" cy="35" r="4"
      fill="#18181B"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2.5, type: "spring" }}
    />
  </motion.svg>
);

export const GraphicVelocity = () => (
  <motion.svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    initial="hidden"
    animate="visible"
  >
    {/* Graph/Waveform illustration simulating data growth */}
    <motion.path
      d="M10 80 Q 25 60, 40 70 T 70 30 T 90 20"
      stroke="#18181B"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
      variants={draw}
      custom={0}
      transition={{ pathLength: { delay: 1, type: "spring", duration: 1.5, bounce: 0 }, opacity: { delay: 1, duration: 0.01 } }}
    />
    <motion.path
      d="M10 80 L 10 90 L 90 90"
      stroke="#E5E7EB"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      variants={draw}
      custom={0.5}
      transition={{ pathLength: { delay: 1.5, type: "spring", duration: 1.5, bounce: 0 }, opacity: { delay: 1.5, duration: 0.01 } }}
    />
    {/* Pastel Accents */}
    <motion.circle
      cx="70" cy="30" r="15"
      fill="#F472B6"
      className="mix-blend-multiply opacity-20"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 1 }}
    />
    <motion.circle
      cx="90" cy="20" r="6"
      fill="#A855F7"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2 }}
    />
  </motion.svg>
);

export const GraphicSentiment = () => (
  <motion.svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    initial="hidden"
    animate="visible"
  >
    {/* Abstract Chat/Bubble composition reflecting the line-art style */}
    <motion.path
      d="M20 50 C 20 30, 40 20, 60 30 C 80 40, 80 70, 50 80 C 35 85, 20 75, 20 75 Z"
      stroke="#18181B"
      strokeWidth="2"
      fill="none"
      variants={draw}
      custom={0}
    />
    <motion.path
      d="M40 45 L 50 55 L 70 30"
      stroke="#22C55E"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      variants={draw}
      custom={1}
    />
    {/* Background accent shape */}
    <motion.rect
      x="45" y="15" width="40" height="40" rx="20"
      fill="#60A5FA"
      className="mix-blend-multiply opacity-20"
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1 }}
    />
  </motion.svg>
);
