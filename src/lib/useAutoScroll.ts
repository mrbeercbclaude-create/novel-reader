import { useEffect, useRef, type RefObject } from 'react';

type Options = {
  readerRef: RefObject<HTMLDivElement>;
  playing: boolean;
  speed: number;
  chapterId?: string;
  pause: () => void;
  onEnd: () => void;
};

export function useAutoScroll(options: Options) {
  const latest = useRef(options);
  latest.current = options;

  useEffect(() => {
    if (!options.playing) return;
    let frame = 0;
    let previous = 0;
    let position: number | undefined;
    let cancelled = false;

    function tick(time: number) {
      const { readerRef, speed, onEnd } = latest.current;
      const element = readerRef.current;
      if (!element || cancelled) return;
      const elapsed = previous ? Math.min(time - previous, 64) / 1000 : 0;
      previous = time;
      position = (position ?? element.scrollTop) + elapsed * speed * 8;
      element.scrollTop = position;
      const bottom = element.scrollHeight - element.clientHeight;
      if (element.scrollTop >= bottom - 1) {
        onEnd();
        return;
      }
      frame = requestAnimationFrame(tick);
    }

    // Wait for the same font readiness used by exact-position restoration.
    void document.fonts.ready.then(() => {
      if (!cancelled) frame = requestAnimationFrame(tick);
    });
    const visibility = () => {
      if (document.hidden) latest.current.pause();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [options.playing, options.chapterId]);
}
