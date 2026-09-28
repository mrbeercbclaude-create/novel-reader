import { boardBlob, db, makeId, type Novel, type Chapter } from '../db';
import { readLibrary } from './dbHelpers';
import type { BackupData } from './backupFormat';

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function encode(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านรูปปกได้'));
    reader.readAsDataURL(blob);
  });
}

export async function exportLibrary() {
  const [novels, chapters, progress, bookmarks, stored, storedBoards] = await db.transaction(
    'r', db.tables, readLibrary,
  );
  const boards = await Promise.all(storedBoards.map(async board => ({
    novelId: board.novelId, name: board.name, order: board.order,
    createdAt: board.createdAt, data: await encode(boardBlob(board)),
  })));
  const preferences = stored.filter(item => typeof item.value === 'string');
  const covers = await Promise.all(stored
    .filter(item => item.key.startsWith('cover:') && item.value instanceof Blob)
    .map(async item => ({ novelId: item.key.slice(6), data: await encode(item.value as Blob) })));
  const content = JSON.stringify({
    format: 'aan-plearn', version: 1, exportedAt: Date.now(),
    novels, chapters, progress, bookmarks, preferences, covers, boards,
  });
  const blob = new Blob([content], { type: 'application/json' });
  if (blob.size > 150 * 1024 * 1024) {
    throw new Error('ข้อมูลเกินขีดจำกัดไฟล์สำรอง 150 MB โปรดเก็บไฟล์ต้นฉบับไว้ด้วย');
  }
  return blob;
}

export function exportNovel(novel: Novel, chapters: Chapter[]) {
  const text = [novel.title, novel.author, novel.description, ...chapters
    .slice().sort((a, b) => a.order - b.order)
    .map(chapter => chapter.title + '\n\n' + chapter.text)].filter(Boolean).join('\n\n');
  const filename = novel.title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 100) || 'novel';
  download(new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' }), filename + '.txt');
}

export async function restoreLibrary(backup: BackupData, mode: 'merge' | 'replace') {
  const data = await boardsAsBytes(backup);
  const novelIds = new Map(data.novels.map(item => [item.id, makeId()]));
  const chapterIds = new Map(data.chapters.map(item => [item.id, makeId()]));
  const positions = <T extends { novelId: string; chapterId: string }>(item: T): T => ({
    ...item, novelId: novelIds.get(item.novelId)!, chapterId: chapterIds.get(item.chapterId)!,
  });
  const preferences = data.preferences.filter(item => mode === 'replace'
    || item.key.startsWith('cover:')).map(item => ({
    ...item, key: item.key.startsWith('cover:')
      ? 'cover:' + novelIds.get(item.key.slice(6))! : item.key,
  }));
  await db.transaction('rw', db.tables, async () => {
    if (mode === 'replace') {
      for (const table of db.tables) await table.clear();
    }
    await db.novels.bulkAdd(data.novels.map(item => ({ ...item, id: novelIds.get(item.id)! })));
    await db.chapters.bulkAdd(data.chapters.map(item => ({
      ...item, id: chapterIds.get(item.id)!, novelId: novelIds.get(item.novelId)!,
    })));
    await db.progress.bulkAdd(data.progress.map(positions));
    await db.bookmarks.bulkAdd(data.bookmarks.map(item => ({ ...positions(item), id: makeId() })));
    await db.preferences.bulkPut(preferences);
    await db.boards.bulkAdd(data.boards.map(item => ({
      ...item, id: makeId(), novelId: novelIds.get(item.novelId)!,
    })));
  });
}

// Runs before the restore transaction: reading Blob bytes is async and would
// otherwise let the IndexedDB transaction auto-commit early.
async function boardsAsBytes(data: BackupData): Promise<BackupData> {
  const boards = await Promise.all(data.boards.map(async item => {
    const blob = boardBlob({ ...item, id: '' });
    return { ...item, image: await blob.arrayBuffer(), imageType: blob.type };
  }));
  return { ...data, boards };
}
