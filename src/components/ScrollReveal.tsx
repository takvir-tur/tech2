import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Optional stagger delay in ms, useful for revealing a row of cards in sequence. */
  delayMs?: number;
}

/**
 * Fades content in and slides it up slightly the first time it scrolls into
 * view — mirrors the Apple.com "reveal on scroll" feel. Each instance only
 * ever triggers once per mount (i.e. once per page load): the observer
 * disconnects itself right after the first reveal, so re-scrolling past the
 * same section doesn't replay the animation. A hard refresh remounts the
 * component from scratch, so the animation naturally plays again.
 */
export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect users who've asked for reduced motion — just show it immediately.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    let observer: IntersectionObserver | null = null;

    // Wait a frame so any scroll-position restoration (e.g. the browser/router
    // jumping back to where the user was when they navigate back to this page)
    // has already happened before we measure anything.
    const rafId = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();

      // If the element is already at or above the current scroll position —
      // which happens when navigating back to a page whose scroll gets
      // restored to somewhere in the middle — reveal it immediately. The
      // "entering from below" animation only makes sense the first time the
      // user scrolls down past it; if we instead wait for an intersection
      // event here, one will never come (an instant scroll jump skips over
      // the intersecting state), and the section stays invisible forever.
      if (rect.top < window.innerHeight) {
        setVisible(true);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer?.unobserve(el);
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
      );
      observer.observe(el);
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}