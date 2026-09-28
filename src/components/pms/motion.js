import { motion } from "motion/react";

// The PMS's animation vocabulary, as the branch PMS has it
// (components/shared/motion.js): opacity and transform only, nothing left
// behind once settled - a leftover transform would make a fixed modal
// inside it position against the card instead of the screen. The shell's
// <MotionConfig reducedMotion="user"> turns it all off for anyone whose
// system asks for less motion.
export { AnimatePresence, MotionConfig } from "motion/react";
export const MotionDiv = motion.div;
export const MotionButton = motion.button;
export const MotionUl = motion.ul;
export const MotionLi = motion.li;

export const EASE_OUT = [0.22, 1, 0.36, 1];

// A page's content arriving after navigation.
export const pageEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: EASE_OUT },
};

// Content swapping in under a tab bar.
export const tabEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: EASE_OUT },
};

// A dialog opening: the backdrop fades, the panel rises into place.
export const backdropEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.18 },
};
export const panelEnter = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: "spring", stiffness: 420, damping: 32 },
};

// A group of cards arriving one after another (parent + child variants).
export const staggerParent = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.05 } },
};
export const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
};
