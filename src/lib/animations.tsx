'use client';

import React from 'react';
import { motion, type Variants, type HTMLMotionProps } from 'framer-motion';

// ─── Shared Animation Variants ───────────────────────────────────────────────

/** Fade up stagger for card grids and lists */
export const staggerContainer: Variants = {
 hidden: {},
 visible: {
 transition: {
 staggerChildren: 0.06,
 delayChildren: 0.04,
 },
 },
};

export const fadeInUp: Variants = {
 hidden: { opacity: 0, y: 8, filter: 'blur(2px)' },
 visible: {
 opacity: 1,
 y: 0,
 filter: 'blur(0px)',
 transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
 },
};

export const fadeIn: Variants = {
 hidden: { opacity: 0 },
 visible: {
 opacity: 1,
 transition: { duration: 0.3, ease: 'easeOut' },
 },
};

/** Scale-in for modals / overlays */
export const scaleIn: Variants = {
 hidden: { opacity: 0, scale: 0.95 },
 visible: {
 opacity: 1,
 scale: 1,
 transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
 },
};

/** Slide up for bottom sheets */
export const slideUp: Variants = {
 hidden: { y: '100%' },
 visible: {
 y: 0,
 transition: { type: 'spring', damping: 30, stiffness: 300 },
 },
 exit: {
 y: '100%',
 transition: { duration: 0.2, ease: 'easeIn' },
 },
};

// ─── Wrapper Components ──────────────────────────────────────────────────────

interface StaggerGroupProps extends HTMLMotionProps<'div'> {
 children: React.ReactNode;
 className?: string;
}

/** Stagger container that animates children with fadeInUp */
export function StaggerGroup({ children, className, ...props }: StaggerGroupProps) {
 return (
 <motion.div
 variants={staggerContainer}
 initial="hidden"
 animate="visible"
 className={className}
 {...props}
 >
 {children}
 </motion.div>
 );
}

interface StaggerItemProps extends HTMLMotionProps<'div'> {
 children: React.ReactNode;
 className?: string;
}

/** Individual stagger child — must be inside a StaggerGroup */
export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
 return (
 <motion.div variants={fadeInUp} className={className} {...props}>
 {children}
 </motion.div>
 );
}
