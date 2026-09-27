import { useState } from 'react';
import { db, type Chapter } from '../db';
import { useApp } from './AppContext';
import { Sheet } from './Sheet';

export function ChapterEditor({ chapter, onClose }: { chapter: Chapter; onClose: () => void }) {
  const { reload, run } = useApp();
  const [title, setTitle] = useState(chapter.title);
  const [text, setText] = useState(chapter.text);

  async function save() {
    if (!title.trim() || !text.trim()) return;
    await db.chapters.update(chapter.id, { title: title.trim(), text });
    await reload();
    onClose();
  }

  async function remove() {
    if (!confirm('ลบบทนี้ออกจากอุปกรณ์? การลบนี้ย้อนกลับไม่ได้')) return;
    await db.transaction('rw', db.chapters, db.bookmarks, db.progress, async () => {
      await db.chapters.delete(chapter.id);
      await db.bookmarks.where('chapterId').equals(chapter.id).delete();
      await db.progress.where('chapterId').equals(chapter.id).delete();
      const remaining = await db.chapters.where('novelId').equals(chapter.novelId).sortBy('order');
      await db.chapters.bulkPut(remaining.map((item, order) => ({ ...item, order })));
    });
    await reload();
    onClose();
  }

  return (
    <Sheet title="แก้ไขบท" onClose={onClose} className="chapter-editor">
      <form className="editor-form" onSubmit={event => {
        event.preventDefault();
        void run(save);
      }}>
        <label>ชื่อบท
          <input value={title} required onChange={e => setTitle(e.target.value)} />
        </label>
        <label>เนื้อหา
          <textarea value={text} required rows={12} onChange={e => setText(e.target.value)} />
        </label>
        <div className="form-actions">
          <button type="button" className="plain-button" onClick={() => void run(remove)}>
            ลบบท
          </button>
          <button className="primary-button" disabled={!title.trim() || !text.trim()}>
            บันทึก
          </button>
        </div>
      </form>
    </Sheet>
  );
}

