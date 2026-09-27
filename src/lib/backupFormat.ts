import type { Bookmark, Chapter, Novel, Preference, Progress } from '../db';
import { defaults } from './preferences';

export type BackupData = {
  novels: Novel[];
  chapters: Chapter[];
  progress: Progress[];
  bookmarks: Bookmark[];
  preferences: Preference[];
};

type Row = Record<string, unknown>;
function invalid(): never {
  throw new Error('ไฟล์สำรองไม่ถูกต้องหรือเป็นรุ่นที่ยังไม่รองรับ');
}
function row(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Row;
}
function list(value: unknown, limit = 100000): Row[] {
  if (!Array.isArray(value) || value.length > limit) invalid();
  return value.map(row);
}
function str(value: unknown, limit = 2000): string {
  if (typeof value !== 'string' || value.length > limit) invalid();
  return value;
}
function id(value: unknown): string {
  const result = str(value, 200);
  if (!result.trim()) invalid();
  return result;
}
function num(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    invalid();
  }
  return value;
}
function unique(values: string[]) {
  if (new Set(values).size !== values.length) invalid();
}

const choices: Record<string, string[]> = {
  font: ['sans', 'sarabun', 'serif', 'system'],
  theme: ['light', 'sepia', 'dark', 'black'],
  align: ['left', 'justify'],
  awake: ['true', 'false'],
  showCovers: ['true', 'false'],
  autoNext: ['true', 'false'],
};
const ranges: Record<string, [number, number]> = {
  size: [15, 30], line: [1.5, 2.5], spacing: [0.5, 2.5],
  margin: [12, 48], autoSpeed: [1, 10],
};

export async function parseBackup(file: File): Promise<BackupData> {
  if (file.size > 150 * 1024 * 1024) {
    throw new Error('ไฟล์สำรองต้องมีขนาดไม่เกิน 150 MB');
  }
  const data = row(JSON.parse(await file.text()));
  if (data.format !== 'aan-plearn' || data.version !== 1) invalid();
  const novels = list(data.novels, 5000).map(item => ({
    id: id(item.id), title: str(item.title), author: str(item.author),
    description: str(item.description, 100000), createdAt: num(item.createdAt),
    updatedAt: num(item.updatedAt), lastRead: num(item.lastRead),
  }));
  unique(novels.map(item => item.id));
  const novelIds = new Set(novels.map(item => item.id));
  const chapters = list(data.chapters).map(item => ({
    id: id(item.id), novelId: id(item.novelId), order: num(item.order, 1000000),
    title: str(item.title), text: str(item.text, 2000000),
  }));
  unique(chapters.map(item => item.id));
  unique(chapters.map(item => JSON.stringify([item.novelId, item.order])));
  const chapterMap = new Map(chapters.map(item => [item.id, item]));
  for (const chapter of chapters) {
    if (!novelIds.has(chapter.novelId) || !Number.isInteger(chapter.order)) invalid();
  }
  function position(item: Row) {
    const novelId = id(item.novelId);
    const chapterId = id(item.chapterId);
    if (!novelIds.has(novelId) || chapterMap.get(chapterId)?.novelId !== novelId) invalid();
    return { novelId, chapterId, scrollTop: num(item.scrollTop, 1000000000) };
  }
  const progress = list(data.progress, 5000).map(item => ({
    ...position(item), percent: num(item.percent, 100), updatedAt: num(item.updatedAt),
  }));
  unique(progress.map(item => item.novelId));
  const bookmarks = list(data.bookmarks).map(item => ({
    ...position(item), id: id(item.id), label: str(item.label), createdAt: num(item.createdAt),
  }));
  unique(bookmarks.map(item => item.id));
  const preferences: Preference[] = [];
  for (const item of list(data.preferences, 100)) {
    const key = str(item.key, 100);
    const value = str(item.value, 100);
    if (key === 'lastBackup') continue;
    if (!Object.prototype.hasOwnProperty.call(defaults, key)) invalid();
    if (choices[key] && !choices[key].includes(value)) invalid();
    if (ranges[key]) {
      const [min, max] = ranges[key];
      if (!value.trim() || !Number.isFinite(Number(value))
        || Number(value) < min || Number(value) > max) invalid();
      if (key === 'autoSpeed' && !Number.isInteger(Number(value))) invalid();
    }
    preferences.push({ key, value });
  }
  for (const item of list(data.covers, 5000)) {
    const novelId = id(item.novelId);
    if (!novelIds.has(novelId)) invalid();
    const encoded = str(item.data, 30 * 1024 * 1024);
    const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(encoded);
    if (!match) invalid();
    const bytes = Uint8Array.from(atob(match[2]), character => character.charCodeAt(0));
    const blob = new Blob([bytes], { type: match[1] });
    const bitmap = await createImageBitmap(blob);
    const valid = bitmap.width <= 900 && bitmap.height <= 9000;
    bitmap.close();
    if (!valid) invalid();
    preferences.push({ key: 'cover:' + novelId, value: blob });
  }
  unique(preferences.map(item => item.key));
  return { novels, chapters, progress, bookmarks, preferences };
}
