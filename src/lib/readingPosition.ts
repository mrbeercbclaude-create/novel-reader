import type { ReadingPosition } from '../db';

export type ReadingLayout = {
  width: number;
  height: number;
  contentHeight: number;
  inset: number;
  paragraphs: { top: number; height: number }[];
};

export function measureReadingLayout(element: HTMLElement): ReadingLayout {
  const origin = element.getBoundingClientRect().top - element.scrollTop;
  return {
    width: element.clientWidth,
    height: element.clientHeight,
    contentHeight: element.querySelector<HTMLElement>('.chapter-content')!.offsetHeight,
    // A stable reading line below the toolbar, even while the toolbar is hidden.
    inset: parseFloat(getComputedStyle(element).paddingTop) || 0,
    paragraphs: Array.from(element.querySelectorAll<HTMLElement>('.story-text > p'), paragraph => {
      const bounds = paragraph.getBoundingClientRect();
      return { top: bounds.top - origin, height: bounds.height };
    }),
  };
}

export function hasParagraph(position: ReadingPosition): boolean {
  return Number.isInteger(position.paragraphIndex) && position.paragraphIndex! >= 0
    && Number.isFinite(position.paragraphProgress)
    && position.paragraphProgress! >= 0 && position.paragraphProgress! <= 1;
}

export function captureReadingPosition(scrollTop: number, layout: ReadingLayout): ReadingPosition {
  const line = scrollTop + layout.inset;
  const paragraphs = layout.paragraphs;
  // The title/header region keeps its pixel position, including a new chapter at 0.
  if (!paragraphs.length || line < paragraphs[0].top) return { scrollTop };
  let low = 0;
  let high = paragraphs.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (paragraphs[middle].top <= line) low = middle;
    else high = middle - 1;
  }
  const paragraph = paragraphs[low];
  return {
    scrollTop,
    paragraphIndex: low,
    paragraphProgress: Math.min(1, Math.max(0, (line - paragraph.top) / (paragraph.height || 1))),
  };
}

export function readingScrollTop(position: ReadingPosition, layout: ReadingLayout): number {
  if (hasParagraph(position)) {
    const paragraph = layout.paragraphs[position.paragraphIndex!];
    if (paragraph) {
      return Math.max(0, paragraph.top + paragraph.height * position.paragraphProgress! - layout.inset);
    }
  }
  // Old rows/backups (or an edited chapter whose paragraph disappeared) keep their pixels.
  return position.scrollTop;
}
