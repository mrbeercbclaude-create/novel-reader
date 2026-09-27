import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, makeId, type Bookmark, type Chapter, type Novel, type Progress } from '../db';
import { defaults, type PreferenceKey, type Preferences } from './preferences';
import { readLibrary } from './dbHelpers';
import { resizeCover } from './covers';

export type View = 'library' | 'reading' | 'settings' | 'details' | 'reader';
export type ReadingTarget = { chapterId: string; scrollTop: number; requestId: number };

export function useAppState() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [covers, setCovers] = useState<Record<string, Blob>>({});
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [view, setView] = useState<View>('library');
  const [activeNovelId, setActiveNovelId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [readingTarget, setReadingTarget] = useState<ReadingTarget | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importTarget, setImportTarget] = useState<string | null>(null);
  const [showAppearance, setShowAppearance] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (work: () => Promise<unknown>) => {
    try {
      await work();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ไม่สามารถบันทึกข้อมูลได้');
    }
  }, []);

  const reload = useCallback(async () => {
    const [books, chapters, positions, marks, preferences] = await readLibrary();
    const strings: Record<string, string> = {};
    const images: Record<string, Blob> = {};
    for (const preference of preferences) {
      if (typeof preference.value === 'string') {
        strings[preference.key] = preference.value;
      } else if (preference.key.startsWith('cover:')) {
        images[preference.key.slice(6)] = preference.value;
      }
    }
    setNovels(books);
    setAllChapters(chapters);
    setProgress(Object.fromEntries(positions.map(position => [position.novelId, position])));
    setBookmarks(marks);
    setCovers(images);
    setPrefs({ ...defaults, ...strings });
  }, []);

  useEffect(() => {
    void run(reload);
    if (navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => false);
    }
  }, [reload, run]);

  const activeNovel = novels.find(novel => novel.id === activeNovelId) || null;
  const activeChapter = allChapters.find(chapter => chapter.id === activeChapterId) || null;
  const chapters = useMemo(() => allChapters
    .filter(chapter => chapter.novelId === activeNovelId)
    .sort((a, b) => a.order - b.order), [allChapters, activeNovelId]);

  const openNovel = (novel: Novel) => {
    setActiveNovelId(novel.id);
    setView('details');
    window.scrollTo(0, 0);
  };

  const startReader = (novel: Novel, chapter?: Chapter, scrollTop?: number) => {
    const list = allChapters
      .filter(item => item.novelId === novel.id)
      .sort((a, b) => a.order - b.order);
    const saved = progress[novel.id];
    const chosen = chapter || list.find(item => item.id === saved?.chapterId) || list[0];
    if (!chosen) {
      setError('เพิ่มบทให้เรื่องนี้ก่อนเริ่มอ่าน');
      return;
    }
    setActiveNovelId(novel.id);
    setActiveChapterId(chosen.id);
    setReadingTarget({
      chapterId: chosen.id,
      scrollTop: scrollTop ?? (chosen.id === saved?.chapterId ? saved.scrollTop : 0),
      requestId: Date.now(),
    });
    setView('reader');
  };

  const openImport = (target: string | null = null) => {
    setImportTarget(target);
    setShowImport(true);
  };

  const updatePref = async (key: PreferenceKey, value: string) => {
    await db.preferences.put({ key, value });
    setPrefs(previous => ({ ...previous, [key]: value }));
  };

  const recordProgress = useCallback(async (position: Progress) => {
    await db.transaction('rw', db.progress, db.novels, async () => {
      await db.progress.put(position);
      await db.novels.update(position.novelId, { lastRead: position.updatedAt });
    });
    setProgress(previous => ({ ...previous, [position.novelId]: position }));
    setNovels(previous => previous.map(novel => novel.id === position.novelId
      ? { ...novel, lastRead: position.updatedAt }
      : novel));
  }, []);

  const saveCover = async (novelId: string, file: File) => {
    const blob = await resizeCover(file);
    await db.preferences.put({ key: 'cover:' + novelId, value: blob });
    setCovers(previous => ({ ...previous, [novelId]: blob }));
  };

  const removeCover = async (novelId: string) => {
    if (!confirm('ลบรูปปกนี้?')) return;
    await db.preferences.delete('cover:' + novelId);
    setCovers(previous => {
      const next = { ...previous };
      delete next[novelId];
      return next;
    });
  };

  const toggleBookmark = async (scrollTop: number) => {
    if (!activeNovel || !activeChapter) return;
    const current = bookmarks.find(bookmark => bookmark.chapterId === activeChapter.id
      && Math.abs(bookmark.scrollTop - scrollTop) < 80);
    if (current) {
      if (!confirm('ลบบุ๊กมาร์กนี้?')) return;
      await db.bookmarks.delete(current.id);
    } else {
      await db.bookmarks.add({
        id: makeId(),
        novelId: activeNovel.id,
        chapterId: activeChapter.id,
        scrollTop,
        label: activeChapter.title,
        createdAt: Date.now(),
      });
    }
    setBookmarks(await db.bookmarks.toArray());
  };

  const deleteBookmark = async (id: string) => {
    if (!confirm('ลบบุ๊กมาร์กนี้?')) return;
    await db.bookmarks.delete(id);
    setBookmarks(previous => previous.filter(bookmark => bookmark.id !== id));
  };

  return {
    novels, allChapters, progress, bookmarks, covers, prefs,
    view, setView, activeNovel, activeChapter, chapters,
    showImport, setShowImport, importTarget, openImport,
    showAppearance, setShowAppearance, readingTarget,
    openNovel, startReader, updatePref, recordProgress,
    toggleBookmark, deleteBookmark, saveCover, removeCover,
    error, setError, run, reload,
  };
}

export type AppState = ReturnType<typeof useAppState>;
