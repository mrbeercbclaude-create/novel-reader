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
class ReaderDB extends Dexie {
  novels!: Table<Novel, string>;
  chapters!: Table<Chapter, string>;
  progress!: Table<Progress, string>;
  bookmarks!: Table<Bookmark, string>;
  preferences!: Table<Preference, string>;
  constructor() {
    super('aan-plearn');
    this.version(1).stores({
      novels: 'id, title, lastRead',
      chapters: 'id, novelId, [novelId+order]',
      progress: 'novelId, chapterId',
      bookmarks: 'id, novelId, chapterId',
      preferences: 'key'
    });
  }
}
export const db = new ReaderDB();
export const makeId = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};
