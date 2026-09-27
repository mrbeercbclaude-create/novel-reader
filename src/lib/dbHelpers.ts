import { db, makeId, type Chapter, type Novel } from '../db';
import type { Draft } from './splitText';

export function readLibrary() {
  return Promise.all([
    db.novels.toArray(),
    db.chapters.toArray(),
    db.progress.toArray(),
    db.bookmarks.toArray(),
    db.preferences.toArray(),
  ]);
}

export async function importChapters(
  drafts: Draft[],
  target: string | null,
  title: string,
) {
  if (!drafts.length || drafts.some(chapter => !chapter.text.trim())) {
    throw new Error('ทุกบทต้องมีเนื้อหาก่อนบันทึก');
  }
  if (drafts.length > 2000 || drafts.some(chapter => chapter.text.length > 2_000_000)) {
    throw new Error('เนื้อหามากเกินไป กรุณาแบ่งนำเข้าทีละส่วน');
  }
  const novelId = target || makeId();
  await db.transaction('rw', db.novels, db.chapters, async () => {
    const now = Date.now();
    if (!target) {
      await db.novels.add({
        id: novelId,
        title: title.trim() || 'นิยายเรื่องใหม่',
        author: '',
        description: '',
        createdAt: now,
        updatedAt: now,
        lastRead: 0,
      });
    }
    const existing = await db.chapters.where('novelId').equals(novelId).sortBy('order');
    const firstOrder = existing.length ? existing[existing.length - 1].order + 1 : 0;
    const chapters: Chapter[] = drafts.map((chapter, index) => ({
      id: makeId(),
      novelId,
      order: firstOrder + index,
      title: chapter.title.trim() || 'บทที่ ' + (firstOrder + index + 1),
      text: chapter.text.trim(),
    }));
    await db.chapters.bulkAdd(chapters);
    await db.novels.update(novelId, { updatedAt: now });
  });
  return novelId;
}

export async function removeNovel(novel: Novel) {
  await db.transaction(
    'rw',
    [db.novels, db.chapters, db.progress, db.bookmarks, db.preferences],
    async () => {
      await db.novels.delete(novel.id);
      await db.chapters.where('novelId').equals(novel.id).delete();
      await db.progress.delete(novel.id);
      await db.bookmarks.where('novelId').equals(novel.id).delete();
      await db.preferences.delete('cover:' + novel.id);
    },
  );
}

