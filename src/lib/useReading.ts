import { useEffect, useRef, useState } from 'react';
import { useApp } from '../components/AppContext';
import type { Progress } from '../db';

export function useReading(playing = false) {
  const {
    activeNovel, activeChapter, readingTarget, prefs, recordProgress, run,
  } = useApp();
  const readerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Progress | null>(null);
  const ready = useRef(false);
  const timer = useRef<number>();
  const lastSave = useRef(0);
  const [percent, setPercent] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  function capture() {
    const element = readerRef.current;
    if (!ready.current || !element || !activeNovel || !activeChapter) return;
    const distance = element.scrollHeight - element.clientHeight;
    const fraction = distance > 0 ? element.scrollTop / distance : 1;
    const current = Math.min(100, Math.max(0, Math.round(fraction * 100)));
    positionRef.current = {
      novelId: activeNovel.id,
      chapterId: activeChapter.id,
      scrollTop: element.scrollTop,
      percent: current,
      updatedAt: Date.now(),
    };
    setPercent(current);
    setScrollTop(element.scrollTop);
  }

  function save() {
    window.clearTimeout(timer.current);
    const position = positionRef.current;
    lastSave.current = Date.now();
    if (position) void run(() => recordProgress(position));
  }

  function onScroll() {
    capture();
    if (Date.now() - lastSave.current >= 1000) save();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(save, 250);
  }

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    ready.current = false;
    positionRef.current = null;
    setPercent(0);
    setScrollTop(0);

    void document.fonts.ready.then(() => {
      if (disposed) return;
      frame = requestAnimationFrame(() => {
        const element = readerRef.current;
        if (!element || disposed) return;
        element.scrollTop = readingTarget?.scrollTop || 0;
        ready.current = true;
        capture();
        save();
      });
    });

    function visibility() {
      if (document.visibilityState === 'hidden') save();
    }

    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      save();
      ready.current = false;
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [activeChapter?.id, readingTarget?.requestId]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let disposed = false;

    async function acquire() {
      if (disposed || document.visibilityState !== 'visible') return;
      if ((!playing && prefs.awake !== 'true') || !('wakeLock' in navigator)) return;
      if (lock && !lock.released) return;
      try {
        const acquired = await navigator.wakeLock.request('screen');
        if (disposed) await acquired.release();
        else lock = acquired;
      } catch {
        // Reading remains available when the browser denies a wake lock.
      }
    }

    void acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release();
    };
  }, [prefs.awake, playing]);

  return { readerRef, percent, scrollTop, onScroll, save };
}
