import Dexie, { type Table } from 'dexie';
export type Novel = {
  id: string;
  title: string;
  author: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  lastRead: number;
};
export type Chapter = {
  id: string;
  novelId: string;
  order: number;
  title: string;
  text: string;
};
export type Progress = {
  novelId: string;
  chapterId: string;
  scrollTop: number;
  percent: number;
  updatedAt: number;
};
export type Bookmark = {
  id: string;
  novelId: string;
  chapterId: string;
  scrollTop: number;
  label: string;
  createdAt: number;
};
export type Preference = {
  key: string;
  value: string | Blob;
};
export type Board = {
  id: string;
  novelId: string;
  name: string;
  order: number;
  // Raw bytes, not a Blob: iOS Safari can hand back Blobs from IndexedDB that
  // no longer load as images after the page reopens them.
  image: ArrayBuffer | Blob;
  imageType?: string;
  createdAt: number;
};

export function boardBlob(board: Board): Blob {
  return board.image instanceof Blob
    ? board.image
    : new Blob([board.image], { type: board.imageType || 'image/png' });
}
class ReaderDB extends Dexie {
  novels!: Table<Novel, string>;
  chapters!: Table<Chapter, string>;
  progress!: Table<Progress, string>;
  bookmarks!: Table<Bookmark, string>;
  preferences!: Table<Preference, string>;
  boards!: Table<Board, string>;
  constructor() {
    super('aan-plearn');
    this.version(1).stores({
      novels: 'id, title, lastRead',
      chapters: 'id, novelId, [novelId+order]',
      progress: 'novelId, chapterId',
      bookmarks: 'id, novelId, chapterId',
      preferences: 'key'
    });
    this.version(2).stores({
      boards: 'id, novelId, [novelId+order]'
    });
  }
}
export const db = new ReaderDB();
export const makeId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};
