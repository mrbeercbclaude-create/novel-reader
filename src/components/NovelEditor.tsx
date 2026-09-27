import { useState } from 'react';
import { db, type Novel } from '../db';
import { useApp } from './AppContext';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

export function NovelEditor({ novel, onClose }: { novel: Novel; onClose: () => void }) {
  const { covers, saveCover, removeCover, reload, run } = useApp();
  const [title, setTitle] = useState(novel.title);
  const [author, setAuthor] = useState(novel.author);
  const [description, setDescription] = useState(novel.description);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    await run(async () => {
      await db.novels.update(novel.id, {
        title: title.trim(),
        author: author.trim(),
        description: description.trim(),
        updatedAt: Date.now(),
      });
      await reload();
      onClose();
    });
    setBusy(false);
  }

  return (
    <Sheet title="แก้ไขนิยาย" onClose={onClose}>
      <form className="editor-form" onSubmit={event => {
        event.preventDefault();
        void save();
      }}>
        <label>ชื่อเรื่อง
          <input value={title} maxLength={300} required onChange={e => setTitle(e.target.value)} />
        </label>
        <label>ผู้เขียน
          <input value={author} maxLength={200} onChange={e => setAuthor(e.target.value)} />
        </label>
        <label>คำโปรย
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} />
        </label>
        <div className="cover-upload">
          <label className="outline-button">
            <Icon name="image" />
            {covers[novel.id] ? 'เปลี่ยนรูปปก' : 'เพิ่มรูปปก'}
            <input
              className="file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy}
              onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                setBusy(true);
                void run(() => saveCover(novel.id, file)).finally(() => setBusy(false));
              }}
            />
          </label>
          {covers[novel.id] && (
            <button
              type="button"
              className="plain-button"
              onClick={() => void run(() => removeCover(novel.id))}
            >ลบรูปปก</button>
          )}
        </div>
        <p className="field-hint">PNG, JPEG หรือ WebP · ปรับความกว้างไม่เกิน 900px</p>
        <button className="primary-button" disabled={busy || !title.trim()}>
          {busy ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </form>
    </Sheet>
  );
}

