export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function revealPreset(delay = 0, distance = 16) {
  const reduce = prefersReducedMotion();
  return reduce ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } } : {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut', delay },
  };
}

export function staggerPreset(stagger = 0.06) {
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: stagger } },
  };
}

export function itemPreset(delay = 0, distance = 14) {
  const reduce = prefersReducedMotion();
  return reduce ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0 } } : {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, ease: 'easeOut', delay },
  };
}
