export type IconName =
  | 'shelf' | 'book' | 'settings' | 'back' | 'next' | 'list'
  | 'bookmark' | 'more' | 'plus' | 'search' | 'close'
  | 'edit' | 'image' | 'trash' | 'reset' | 'check' | 'minus' | 'up'
  | 'play' | 'pause';

const paths: Record<IconName, string> = {
  play: 'M7 3l14 9-14 9z',
  pause: 'M8 4v16M16 4v16',
  shelf: 'M4 4h4v14H4zM10 4h4v14h-4zM16 5l4-1 3 13-4 1zM2 21h20',
  book: 'M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1zM12 5v15',
  settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z'
    + 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  back: 'M15 4l-8 8 8 8',
  next: 'M9 4l8 8-8 8',
  list: 'M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  more: 'M12 4h.01M12 12h.01M12 20h.01',
  plus: 'M12 4v16M4 12h16',
  search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  close: 'M5 5l14 14M19 5L5 19',
  edit: 'M14 5l5 5M4 20l5-1L21 7l-4-4L5 15z',
  image: 'M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M16 7h.01',
  trash: 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  reset: 'M4 9a8 8 0 1 1 0 6M4 3v6h6',
  check: 'M4 12l5 5L20 6',
  minus: 'M4 12h16',
  up: 'M5 12l7-7 7 7M12 5v16',
};

export function Icon({ name, filled = false }: { name: IconName; filled?: boolean }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3 : 1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} fillRule="evenodd" />
    </svg>
  );
}
