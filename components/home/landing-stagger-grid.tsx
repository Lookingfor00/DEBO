"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LandingStaggerGridProps = {
  children: ReactNode;
  className?: string;
  as?: "ul" | "div";
};

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

export function LandingStaggerGrid({
  children,
  className,
  as = "ul",
}: LandingStaggerGridProps) {
  const reduceMotion = useReducedMotion();
  const Tag = as === "div" ? "div" : "ul";

  if (reduceMotion) {
    return (
      <Tag data-landing-stagger className={className}>
        {children}
      </Tag>
    );
  }

  const MotionTag = as === "div" ? motion.div : motion.ul;

  return (
    <MotionTag
      data-landing-stagger
      className={cn(className)}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </MotionTag>
  );
}

type LandingStaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function LandingStaggerItem({
  children,
  className,
}: LandingStaggerItemProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <li data-landing-stagger-item className={className}>
        {children}
      </li>
    );
  }

  return (
    <motion.li
      data-landing-stagger-item
      className={cn(className)}
      variants={itemVariants}
    >
      {children}
    </motion.li>
  );
}
