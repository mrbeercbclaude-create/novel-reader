import { useState } from 'react';
import { useApp } from '../components/AppContext';
import { Cover } from '../components/Cover';
import { Icon } from '../components/Icon';
import { NovelEditor } from '../components/NovelEditor';
import { ChapterEditor } from '../components/ChapterEditor';
import { removeNovel } from '../lib/dbHelpers';
import type { Chapter } from '../db';
import { exportNovel } from '../lib/backup';

export function NovelDetails() {
  const {
    activeNovel, chapters, setView, startReader, openImport, reload, run,
  } = useApp();
  const [editing, setEditing] = useState(false);
  const [editChapter, setEditChapter] = useState<Chapter | null>(null);
  if (!activeNovel) return null;
  const novel = activeNovel;

  async function remove() {
    if (!confirm('ลบนิยายและบททั้งหมดออกจากอุปกรณ์? การลบนี้ย้อนกลับไม่ได้')) return;
    await removeNovel(novel);
    await reload();
    setView('library');
  }

  return (
    <section className="details-screen">
      <div className="detail-intro">
        <div className="detail-cover-wrap">
          <Cover novel={novel} hero />
          <header className="detail-toolbar">
            <button className="icon-button" aria-label="กลับชั้นหนังสือ"
              onClick={() => setView('library')}>
              <Icon name="back" />
            </button>
            <button className="icon-button" aria-label="แก้ไขนิยาย"
              onClick={() => setEditing(true)}>
              <Icon name="edit" />
            </button>
          </header>
        </div>
        <div className="detail-metadata">
          <p className="detail-count">{chapters.length} บท</p>
          <h1>{novel.title}</h1>
          <p className="detail-author">{novel.author || 'ไม่ระบุผู้เขียน'}</p>
          {novel.description && <p className="detail-description">{novel.description}</p>}
          <div className="detail-actions">
            <button className="primary-button" onClick={() => startReader(novel)}>
              <Icon name="book" />อ่านเลย
            </button>
            <button className="outline-button" onClick={() => openImport(novel.id)}>
              <Icon name="plus" />เพิ่มบท
            </button>
          </div>
        </div>
      </div>
      <div className="detail-chapters">
        <div className="section-heading">
          <h2>สารบัญ</h2><span>{chapters.length} บท</span>
        </div>
        <div className="chapter-list">
          {chapters.map((chapter, index) => (
            <div className="chapter-row" key={chapter.id}>
              <button onClick={() => startReader(novel, chapter)}>
                <span className="chapter-number">{index + 1}</span>
                <span>{chapter.title}</span>
              </button>
              <button className="icon-button" aria-label={'แก้ไข ' + chapter.title}
                onClick={() => setEditChapter(chapter)}>
                <Icon name="more" />
              </button>
            </div>
          ))}
        </div>
        {!chapters.length && <p className="empty-state">ยังไม่มีบท เพิ่มเนื้อหาเพื่อเริ่มอ่าน</p>}
        <div className="detail-management">
          <button className="plain-button" onClick={() => exportNovel(novel, chapters)}>
            ส่งออกนิยาย (.txt)
          </button>
          <button className="plain-button" onClick={() => setEditing(true)}>
            แก้ไขข้อมูลและรูปปก
          </button>
          <button className="plain-button" onClick={() => void run(remove)}>ลบนิยาย</button>
        </div>
      </div>
      {editing && <NovelEditor novel={novel} onClose={() => setEditing(false)} />}
      {editChapter && (
        <ChapterEditor chapter={editChapter} onClose={() => setEditChapter(null)} />
      )}
    </section>
  );
}
