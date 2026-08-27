"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  question: string;
  children: ReactNode;
  caption?: ReactNode;
  className?: string;
}

export function Section({ id, title, question, children, caption, className }: SectionProps) {
  const prefersReducedMotion = useReducedMotion();

  // Two deliberate safety choices here, both learned from a real bug
  // found in QA:
  //
  // 1. Never animate opacity. A whileInView animation's `initial` prop
  //    is captured once at mount; useReducedMotion() only resolves
  //    client-side (SSR has no OS motion preference to read), so an
  //    opacity-hiding initial state can get permanently stuck (React
  //    won't patch a hydration-mismatched inline style) until a real
  //    scroll-into-view event -- which never happens for reduced-motion
  //    users who don't scroll. Only a small position offset is animated,
  //    so worst case the section is merely unshifted, never hidden.
  //
  // 2. `initial` is identical on every render (not branched on
  //    useReducedMotion()), so the SSR markup always matches the
  //    client's first render -- no hydration mismatch at all. Only
  //    `transition` duration varies, since it isn't serialized into the
  //    SSR'd inline style and so can't cause one.
  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-heading`}
      initial={{ y: 8 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0, margin: "0px 0px -10% 0px" }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeOut" }}
      className={`mx-auto max-w-[1320px] px-4 py-10 sm:px-6 ${className ?? ""}`}
    >
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-ink sm:text-xl">
        {title}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{question}</p>
      <div className="mt-6">{children}</div>
      {caption ? <div className="mt-3 text-sm text-ink-muted">{caption}</div> : null}
    </motion.section>
  );
}

export function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-md border border-dashed border-border bg-surface px-6 text-center text-sm text-ink-muted">
      {message}
    </div>
  );
}
