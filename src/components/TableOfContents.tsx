import { useState } from 'react';
import { useApp } from './AppContext';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

export function TableOfContents({ onClose, beforeNavigate }: {
  onClose: () => void;
  beforeNavigate: () => void;
}) {
  const {
    activeNovel, activeChapter, chapters, bookmarks,
    startReader, deleteBookmark, run,
  } = useApp();
  const [tab, setTab] = useState('chapters');
  if (!activeNovel) return null;
  const novel = activeNovel;
  const marks = bookmarks.filter(bookmark => bookmark.novelId === novel.id);

  return (
    <Sheet title="สารบัญ" onClose={onClose} className="toc-sheet">
      <p className="toc-title">{novel.title}</p>
      <div className="page-tabs" role="tablist" aria-label="สารบัญและบุ๊กมาร์ก">
        <button role="tab" aria-selected={tab === 'chapters'}
          className={tab === 'chapters' ? 'active' : ''}
          onClick={() => setTab('chapters')}>
          ทั้งหมด ({chapters.length})
        </button>
        <button role="tab" aria-selected={tab === 'bookmarks'}
          className={tab === 'bookmarks' ? 'active' : ''}
          onClick={() => setTab('bookmarks')}>บุ๊กมาร์ก ({marks.length})</button>
      </div>
      {tab === 'chapters' ? chapters.map((chapter, index) => (
        <button
          key={chapter.id}
          className={'toc-row ' + (chapter.id === activeChapter?.id ? 'active' : '')}
          aria-current={chapter.id === activeChapter?.id ? 'location' : undefined}
          onClick={() => {
            beforeNavigate();
            startReader(novel, chapter, 0);
            onClose();
          }}
        >
          <span className="chapter-number">{index + 1}</span>
          <span>{chapter.title}</span>
        </button>
      )) : marks.length ? marks.map(bookmark => (
        <div className="bookmark-row" key={bookmark.id}>
          <button onClick={() => {
            const chapter = chapters.find(item => item.id === bookmark.chapterId);
            if (chapter) {
              beforeNavigate();
              startReader(novel, chapter, bookmark.scrollTop);
              onClose();
            }
          }}>
            <Icon name="bookmark" />
            <span>{bookmark.label}</span>
          </button>
          <button className="icon-button" aria-label={'ลบบุ๊กมาร์ก ' + bookmark.label}
            onClick={() => void run(() => deleteBookmark(bookmark.id))}>
            <Icon name="trash" />
          </button>
        </div>
      )) : <p className="empty-state">ยังไม่มีบุ๊กมาร์ก</p>}
    </Sheet>
  );
}

