import { useRef, useState } from 'react';
import { useApp } from '../components/AppContext';
import { Sheet } from '../components/Sheet';
import { Icon } from '../components/Icon';
import { splitText, type Draft } from '../lib/splitText';
import { importChapters } from '../lib/dbHelpers';
import { db } from '../db';

export function Import() {
  const { importTarget, setShowImport, reload, openNovel, run } = useApp();
  const [paste, setPaste] = useState('');
  const [title, setTitle] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const carets = useRef<Record<number, number>>({});

  function acceptText(text: string) {
    if (text.length > 10_000_000) throw new Error('นำเข้าได้ครั้งละไม่เกิน 10 MB');
    if (text.includes('\0')) throw new Error('ไฟล์นี้ไม่ใช่ข้อความ UTF-8');
    setPaste(text);
    setDrafts(splitText(text));
  }

  function edit(index: number, patch: Partial<Draft>) {
    setDrafts(previous => previous.map((draft, i) => i === index ? { ...draft, ...patch } : draft));
  }

  function merge(index: number) {
    setDrafts(previous => {
      const next = [...previous];
      next[index - 1] = {
        title: next[index - 1].title,
        text: next[index - 1].text + '\n\n' + next[index].text,
      };
      next.splice(index, 1);
      return next;
    });
  }

  function split(index: number) {
    const draft = drafts[index];
    let at = carets.current[index] || 0;
    if (at <= 0 || at >= draft.text.length) at = draft.text.indexOf('\n');
    if (at <= 0 || at >= draft.text.length) {
      throw new Error('แตะในเนื้อหาเพื่อเลือกตำแหน่งที่ต้องการแบ่งบท');
    }
    const before = draft.text.slice(0, at).trim();
    const after = draft.text.slice(at).trim();
    if (!before || !after) throw new Error('เลือกตำแหน่งภายในเนื้อหาบท');
    setDrafts(previous => [
      ...previous.slice(0, index),
      { title: draft.title, text: before },
      { title: draft.title + ' (ต่อ)', text: after },
      ...previous.slice(index + 1),
    ]);
  }

  async function filesChanged(files: File[]) {
    if (files.reduce((size, file) => size + file.size, 0) > 10_000_000) {
      throw new Error('ไฟล์รวมต้องมีขนาดไม่เกิน 10 MB');
    }
    const texts = await Promise.all(files.map(async file => {
      if (!/\.(txt|md)$/i.test(file.name)) throw new Error('เลือกไฟล์ .txt หรือ .md เท่านั้น');
      return '# ' + file.name.replace(/\.(txt|md)$/i, '') + '\n' + await file.text();
    }));
    acceptText(texts.join('\n\n'));
    if (!title && files.length) setTitle(files[0].name.replace(/\.(txt|md)$/i, ''));
  }

  async function save() {
    setBusy(true);
    await run(async () => {
      const id = await importChapters(drafts, importTarget, title);
      await reload();
      const novel = await db.novels.get(id);
      setShowImport(false);
      if (novel) openNovel(novel);
    });
    setBusy(false);
  }

  return (
    <Sheet
      title={importTarget ? 'เพิ่มบท' : 'นำเข้านิยาย'}
      onClose={() => setShowImport(false)}
      className="import-sheet"
    >
      <div className="import-content">
        {!importTarget && (
          <label className="field-label">ชื่อเรื่อง
            <input value={title} maxLength={300} onChange={e => setTitle(e.target.value)}
              placeholder="ชื่อนิยาย" />
          </label>
        )}
        <label className="field-label">ข้อความนิยาย
          <textarea
            className="paste-box"
            value={paste}
            placeholder={'วางข้อความที่นี่\n\nบทที่ 1\nเนื้อหานิยาย…'}
            onChange={e => void run(async () => acceptText(e.target.value))}
          />
        </label>
        <label className="outline-button file-pick">
          <Icon name="plus" />เลือกไฟล์ .txt / .md
          <input
            className="file-input"
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            multiple
            onChange={e => {
              const files = Array.from(e.target.files || []);
              e.target.value = '';
              if (files.length) void run(() => filesChanged(files));
            }}
          />
        </label>
        <p className="field-hint">
          ตรวจจับชื่อบทอัตโนมัติจาก บทที่, ตอนที่, Chapter และ # heading
        </p>
        {drafts.length > 0 && (
          <>
            <div className="section-heading">
              <h3>ตรวจสอบก่อนบันทึก</h3><span>{drafts.length} บท</span>
            </div>
            {drafts.map((draft, index) => (
              <div className="draft-card" key={index}>
                <label className="field-label">ชื่อบท {index + 1}
                  <input value={draft.title}
                    onChange={e => edit(index, { title: e.target.value })} />
                </label>
                <label className="field-label">เนื้อหาบท {index + 1}
                  <textarea
                    value={draft.text}
                    rows={4}
                    onChange={e => edit(index, { text: e.target.value })}
                    onSelect={e => {
                      carets.current[index] = e.currentTarget.selectionStart;
                    }}
                  />
                </label>
                <small>{draft.text.length.toLocaleString()} ตัวอักษร</small>
                <div className="draft-actions">
                  <button disabled={index === 0} onClick={() => merge(index)}>รวมกับบทก่อน</button>
                  <button onClick={() => void run(async () => split(index))}>แบ่งบท</button>
                  <button aria-label={'ลบร่างบท ' + (index + 1)} onClick={() => {
                    if (!confirm('ลบร่างบทนี้จากรายการนำเข้า?')) return;
                    setDrafts(previous => previous.filter((_, i) => i !== index));
                  }}><Icon name="trash" /></button>
                </div>
              </div>
            ))}
          </>
        )}
        <div className="import-footer">
          <button className="plain-button" onClick={() => setShowImport(false)}>ยกเลิก</button>
          <button className="primary-button"
            disabled={busy || !drafts.length || drafts.some(draft => !draft.text.trim())}
            onClick={() => void save()}>
            {busy ? 'กำลังบันทึก…' : 'บันทึก ' + drafts.length + ' บท'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
