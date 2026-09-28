import { motion } from "motion/react";

// The PMS's animation vocabulary, as the branch PMS has it
// (components/shared/motion.js): opacity and transform only, nothing left
// behind once settled - a leftover transform would make a fixed modal
// inside it position against the card instead of the screen. The shell's
// <MotionConfig reducedMotion="user"> turns it all off for anyone whose
// system asks for less motion.
export const MotionDiv = motion.div;
export const MotionButton = motion.button;

export const EASE_OUT = [0.22, 1, 0.36, 1];

// A group of cards arriving one after another (parent + child variants).
export const staggerParent = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.05 } },
};
export const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};
