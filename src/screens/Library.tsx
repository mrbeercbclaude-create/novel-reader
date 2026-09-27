import { useState } from 'react';
import { useApp } from '../components/AppContext';
import { Cover } from '../components/Cover';
import { Icon } from '../components/Icon';
import { BackupReminder } from '../components/BackupControls';

export function Library() {
  const {
    novels, allChapters, progress, bookmarks, view, openImport,
    openNovel, startReader, deleteBookmark, run,
  } = useApp();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('recent');
  const [tab, setTab] = useState('all');
  const reading = view === 'reading';
  const recent = [...novels]
    .filter(novel => progress[novel.id])
    .sort((a, b) => b.lastRead - a.lastRead);
  const current = recent[0];
  const source = reading ? recent : novels;
  const books = source.filter(novel => {
    const matchesTitle = novel.title.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    const matchesTab = tab !== 'bookmarks'
      || bookmarks.some(bookmark => bookmark.novelId === novel.id);
    return matchesTitle && matchesTab;
  }).sort((a, b) => sort === 'title'
    ? a.title.localeCompare(b.title, 'th')
    : b.lastRead - a.lastRead || b.createdAt - a.createdAt);

  return (
    <section className="library-screen">
      <header className="page-header">
        <h1>{reading ? 'กำลังอ่าน' : 'ชั้นหนังสือ'}</h1>
        <button className="icon-button accent" aria-label="เพิ่มนิยาย" onClick={() => openImport()}>
          <Icon name="plus" />
        </button>
      </header>
      <div className="page-tabs" role="tablist" aria-label="หมวดหนังสือ">
        <button
          role="tab"
          aria-selected={tab === 'all'}
          className={tab === 'all' ? 'active' : ''}
          onClick={() => setTab('all')}
        >
          {reading ? 'อ่านล่าสุด' : 'ทั้งหมด'}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'bookmarks'}
          className={tab === 'bookmarks' ? 'active' : ''}
          onClick={() => setTab('bookmarks')}
        >
          บุ๊กมาร์ก
        </button>
      </div>
      <div className="library-content">
        <BackupReminder />
        {!reading && current && (
          <button className="continue-row" onClick={() => startReader(current)}>
            <Cover novel={current} />
            <span className="continue-copy">
              <small className="accent-text">อ่านต่อ</small>
              <strong>{current.title}</strong>
              <small>
                {allChapters.find(chapter => chapter.id === progress[current.id]?.chapterId)?.title}
                {' · '}{progress[current.id]?.percent || 0}%
              </small>
              <span className="progress-track">
                <i style={{ width: (progress[current.id]?.percent || 0) + '%' }} />
              </span>
            </span>
            <Icon name="next" />
          </button>
        )}
        <div className="library-tools">
          <label className="search-field">
            <Icon name="search" />
            <input
              aria-label="ค้นหาชื่อเรื่อง"
              placeholder="ค้นหาชื่อเรื่อง"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </label>
          <select aria-label="เรียงลำดับ" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recent">อ่านล่าสุด</option>
            <option value="title">ชื่อเรื่อง</option>
          </select>
        </div>
        <div className="section-heading">
          <h2>
            {tab === 'bookmarks' ? 'เรื่องที่คั่นหน้าไว้' : reading ? 'อ่านล่าสุด' : 'นิยายทั้งหมด'}
          </h2>
          <span>{books.length} เรื่อง</span>
        </div>
        {books.length === 0 ? (
          <div className="empty-state">
            <p>
              {query ? 'ไม่พบชื่อเรื่องนี้'
                : reading ? 'ยังไม่มีรายการอ่าน' : 'ยังไม่มีนิยายในชั้น'}
            </p>
            <span>วางข้อความหรือเลือกไฟล์ .txt / .md</span>
            <button className="primary-button" onClick={() => openImport()}>
              เพิ่มนิยาย
            </button>
          </div>
        ) : (
          <div className="book-grid">
            {books.map(novel => (
              <article className="book-card" key={novel.id}>
                <button onClick={() => reading ? startReader(novel) : openNovel(novel)}>
                  <Cover novel={novel} />
                  <h3>{novel.title}</h3>
                  <p>{novel.author || 'ไม่ระบุผู้เขียน'}</p>
                  <small>
                    {allChapters.filter(chapter => chapter.novelId === novel.id).length} บท
                  </small>
                </button>
                {tab === 'bookmarks' && bookmarks
                  .filter(bookmark => bookmark.novelId === novel.id)
                  .map(bookmark => (
                    <div className="bookmark-row" key={bookmark.id}>
                      <button onClick={() => {
                        const chapter = allChapters.find(item => item.id === bookmark.chapterId);
                        if (chapter) startReader(novel, chapter, bookmark.scrollTop);
                      }}>
                        <Icon name="bookmark" />
                        <span>{bookmark.label}</span>
                      </button>
                      <button
                        className="icon-button"
                        aria-label={'ลบบุ๊กมาร์ก ' + bookmark.label}
                        onClick={() => void run(() => deleteBookmark(bookmark.id))}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                  ))}
              </article>
            ))}
          </div>
        )}
        <p className="storage-note">นิยายและตำแหน่งที่อ่านเก็บไว้ในอุปกรณ์นี้</p>
      </div>
    </section>
  );
}
