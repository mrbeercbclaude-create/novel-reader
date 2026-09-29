import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

type Point = { x: number; y: number };
type Transform = Point & { scale: number };
type Gesture = {
  start: Point;
  time: number;
  moved: boolean;
  multiple: boolean;
  canSwipe: boolean;
};
const INITIAL: Transform = { scale: 1, x: 0, y: 0 };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

export function useBoardGestures(boardKey: string, onSwipe: (step: -1 | 1) => void) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [view, setView] = useState(INITIAL);
  // Refs keep consecutive pointer events in sync, including two moves in one React frame.
  const transform = useRef(INITIAL);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const baseline = useRef({ point: { x: 0, y: 0 }, distance: 0, transform: INITIAL });
  const lastTap = useRef<{ point: Point; time: number } | null>(null);

  function apply(next: Transform) {
    const stage = stageRef.current;
    const image = imageRef.current;
    if (!stage || !image) return;
    const scale = Math.max(1, Math.min(4, next.scale));
    const maxX = Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (image.offsetHeight * scale - stage.clientHeight) / 2);
    const bounded = {
      scale,
      x: scale === 1 ? 0 : Math.max(-maxX, Math.min(maxX, next.x)),
      y: scale === 1 ? 0 : Math.max(-maxY, Math.min(maxY, next.y)),
    };
    transform.current = bounded;
    setView(previous => previous.scale === bounded.scale && previous.x === bounded.x
      && previous.y === bounded.y ? previous : bounded);
  }

  function point(event: PointerEvent<HTMLDivElement>): Point {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left - bounds.width / 2,
      y: event.clientY - bounds.top - bounds.height / 2 };
  }

  function rebase() {
    const [first, second] = pointers.current.values();
    if (!first) return;
    baseline.current = {
      point: second ? midpoint(first, second) : first,
      distance: second ? distance(first, second) : 0,
      transform: transform.current,
    };
  }

  function cancel() {
    const ids = [...pointers.current.keys()];
    pointers.current.clear();
    gesture.current = null;
    lastTap.current = null;
    for (const id of ids) {
      if (stageRef.current?.hasPointerCapture(id)) stageRef.current.releasePointerCapture(id);
    }
  }

  useLayoutEffect(() => {
    cancel();
    apply(INITIAL);
    const observer = new ResizeObserver(() => {
      // A rotation changes our coordinate system; discard the old gesture, retain bounded zoom.
      cancel();
      apply(transform.current);
    });
    if (stageRef.current) observer.observe(stageRef.current);
    if (imageRef.current) observer.observe(imageRef.current);
    return () => {
      observer.disconnect();
      cancel();
    };
  }, [boardKey]);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const current = point(event);
    if (!pointers.current.size) {
      gesture.current = {
        start: current, time: event.timeStamp, moved: false, multiple: false,
        canSwipe: transform.current.scale === 1,
      };
    } else if (gesture.current) {
      gesture.current.multiple = true;
      lastTap.current = null;
    }
    pointers.current.set(event.pointerId, current);
    event.currentTarget.setPointerCapture(event.pointerId);
    rebase();
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    const current = point(event);
    pointers.current.set(event.pointerId, current);
    if (gesture.current && distance(current, gesture.current.start) > 10) {
      gesture.current.moved = true;
      lastTap.current = null;
    }
    const [first, second] = pointers.current.values();
    const base = baseline.current;
    if (second) {
      if (base.distance < 1) {
        rebase();
        return;
      }
      const scale = Math.max(1, Math.min(4,
        base.transform.scale * distance(first, second) / base.distance));
      const center = midpoint(first, second);
      const ratio = scale / base.transform.scale;
      // Keep the image point under the fingers' midpoint while scaling and translating.
      apply({ scale,
        x: center.x - (base.point.x - base.transform.x) * ratio,
        y: center.y - (base.point.y - base.transform.y) * ratio,
      });
    } else if (transform.current.scale > 1) {
      apply({ scale: base.transform.scale,
        x: base.transform.x + first.x - base.point.x,
        y: base.transform.y + first.y - base.point.y,
      });
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    onPointerMove(event);
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointers.current.size) {
      // A lifted finger must not turn a pinch into a swipe; remaining fingers can keep panning.
      rebase();
      return;
    }
    const completed = gesture.current;
    gesture.current = null;
    if (!completed || completed.multiple) return;
    const end = point(event);
    const dx = end.x - completed.start.x;
    const dy = end.y - completed.start.y;
    if (completed.canSwipe && transform.current.scale === 1
      && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      lastTap.current = null;
      onSwipe(dx > 0 ? -1 : 1);
      return;
    }
    if (completed.moved || event.timeStamp - completed.time > 300) {
      lastTap.current = null;
      return;
    }
    const tap = lastTap.current;
    if (tap && event.timeStamp - tap.time < 320 && distance(tap.point, end) < 24) {
      lastTap.current = null;
      if (transform.current.scale > 1) apply(INITIAL);
      else apply({ scale: 2, x: -end.x, y: -end.y });
    } else {
      lastTap.current = { point: end, time: event.timeStamp };
    }
  }

  return {
    stageRef, imageRef, zoomed: view.scale > 1,
    imageStyle: { transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` },
    onLoad: () => apply(transform.current),
    onPointerDown, onPointerMove, onPointerUp,
    onPointerCancel: cancel,
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (pointers.current.has(event.pointerId)) cancel();
    },
  };
}
