import { useEffect, useRef } from 'react';

interface ScrollEngineOptions {
  isPlaying: boolean;
  speed: number; // px/sec
  containerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
}

/**
 * Drives smooth scrolling using requestAnimationFrame + CSS transform,
 * rather than mutating scrollTop every frame (which triggers layout
 * recalculation and causes jank on long scripts).
 */
export function useScrollEngine({
  isPlaying,
  speed,
  containerRef,
  contentRef,
}: ScrollEngineOptions) {
  const positionRef = useRef(0); // current scroll offset in px
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef(speed);

  // Keep the latest speed value available inside the RAF loop without
  // having to restart the loop on every speed change.
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const step = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time;
      const deltaSec = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      positionRef.current += speedRef.current * deltaSec;

      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(-${positionRef.current}px)`;
      }

      // Stop automatically once we've scrolled past the end of the script.
      const maxScroll =
        (contentRef.current?.scrollHeight ?? 0) -
        (containerRef.current?.clientHeight ?? 0);
      if (maxScroll > 0 && positionRef.current < maxScroll) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const restart = () => {
    positionRef.current = 0;
    if (contentRef.current) {
      contentRef.current.style.transform = 'translateY(0px)';
    }
  };

  return { restart };
}
