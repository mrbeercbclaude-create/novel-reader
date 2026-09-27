import { useState, type CSSProperties } from 'react';
import { useApp } from '../components/AppContext';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { TableOfContents } from '../components/TableOfContents';
import { useReading } from '../lib/useReading';
import { useAutoScroll } from '../lib/useAutoScroll';

export function Reader() {
  const {
    activeNovel, activeChapter, chapters, prefs, bookmarks, setView,
    startReader, toggleBookmark, setShowAppearance, updatePref, run,
  } = useApp();
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const { readerRef, percent, scrollTop, onScroll, save } = useReading(playing);
  const [chrome, setChrome] = useState(true);
  const [toc, setToc] = useState(false);
  const [more, setMore] = useState(false);
  const speed = Math.max(1, Math.min(10, Number(prefs.autoSpeed) || 3));
  function pause() {
    setPlaying(false);
    save();
  }
  useAutoScroll({
    readerRef, playing, speed, chapterId: activeChapter?.id, pause,
    onEnd: () => {
      onScroll();
      save();
      const current = chapters.findIndex(item => item.id === activeChapter?.id);
      const next = chapters[current + 1];
      if (prefs.autoNext === 'true' && next && activeNovel) {
        startReader(activeNovel, next, 0);
      } else {
        setPlaying(false);
        setEnded(true);
        setChrome(true);
      }
    },
  });
  if (!activeNovel || !activeChapter) return null;
  const novel = activeNovel;
  const chapter = activeChapter;
  const index = chapters.findIndex(item => item.id === chapter.id);
  const bookmarked = bookmarks.some(mark => mark.chapterId === chapter.id
    && Math.abs(mark.scrollTop - scrollTop) < 80);
  const minutes = Math.max(1, Math.ceil(chapter.text.replace(/\s/g, '').length
    / 650 * (1 - percent / 100)));
  const focusIndex = chrome ? 0 : -1;

  function move(delta: number) {
    pause();
    setEnded(false);
    const next = chapters[index + delta];
    if (!next) return;
    save();
    startReader(novel, next, 0);
  }

  function leave() {
    save();
    setView('details');
  }

  const typography = {
    '--font-size': prefs.size + 'px',
    '--line-height': prefs.line,
    '--paragraph-space': prefs.spacing + 'em',
    '--reader-margin': prefs.margin + 'px',
    '--text-align': prefs.align,
  } as CSSProperties;

  return (
    <section className={'reader-screen theme-' + prefs.theme}>
      <header className={'reader-top ' + (chrome ? 'shown' : '')} aria-hidden={!chrome}>
        <button className="icon-button" aria-label="กลับ" onClick={leave} tabIndex={focusIndex}>
          <Icon name="back" />
        </button>
        <span className="reader-toolbar-title">{chapter.title}</span>
        <button className="icon-button" aria-label="สารบัญ" tabIndex={focusIndex}
          onClick={() => setToc(true)}><Icon name="list" /></button>
        <button className="icon-button type-button" aria-label="ตั้งค่าหน้าอ่าน"
          tabIndex={focusIndex} onClick={() => setShowAppearance(true)}>Aa</button>
        <button className="icon-button" aria-label="คั่นหน้าตรงนี้" aria-pressed={bookmarked}
          tabIndex={focusIndex}
          onClick={() => void run(() => toggleBookmark(readerRef.current?.scrollTop || 0))}>
          <Icon name="bookmark" filled={bookmarked} />
        </button>
        <button className="icon-button" aria-label="เพิ่มเติม" tabIndex={focusIndex}
          onClick={() => setMore(true)}><Icon name="more" /></button>
      </header>
      <div
        className="reading-area"
        ref={readerRef}
        onScroll={onScroll}
        onPointerDown={pause}
        onTouchStart={pause}
        onWheel={pause}
        onKeyDown={pause}
        style={typography}
        onClick={event => {
          if ((event.target as HTMLElement).closest('button')) return;
          if (window.getSelection()?.toString()) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          const relative = (event.clientX - bounds.left) / bounds.width;
          if (relative > 0.25 && relative < 0.75) setChrome(value => !value);
        }}
      >
        <article className={'chapter-content font-' + prefs.font} lang="th">
          <p className="reading-story-name">เรื่อง : {novel.title}</p>
          <h1>{chapter.title}</h1>
          {novel.author && <p className="reading-author">โดย : {novel.author}</p>}
          <div className="story-text">
            {chapter.text.split(/\n\s*\n/).map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>{paragraph}</p>
            ))}
          </div>
          <div className="chapter-end">
            <span>จบบท</span>
            <div>
              <button className="outline-button" disabled={index === 0} onClick={() => move(-1)}>
                <Icon name="back" />ก่อนหน้า
              </button>
              <button className="outline-button" disabled={index === chapters.length - 1}
                onClick={() => move(1)}>ถัดไป<Icon name="next" /></button>
            </div>
          </div>
        </article>
      </div>
      {playing && (
        <div className={'auto-speed ' + (chrome ? 'above-bars' : '')}>
          <button className="icon-button" aria-label="ช้าลง" disabled={speed === 1}
            onClick={() => void run(() => updatePref('autoSpeed', String(speed - 1)))}>
            <Icon name="minus" />
          </button>
          <output aria-live="polite">ความเร็ว {speed}/10</output>
          <button className="icon-button" aria-label="เร็วขึ้น" disabled={speed === 10}
            onClick={() => void run(() => updatePref('autoSpeed', String(speed + 1)))}>
            <Icon name="plus" />
          </button>
          <button className="icon-button" aria-label="หยุดชั่วคราว" onClick={() => {
            pause();
            setChrome(true);
          }}><Icon name="pause" /></button>
        </div>
      )}
      {ended && index < chapters.length - 1 && (
        <button className="auto-next outline-button" onClick={() => move(1)}>ตอนถัดไป</button>
      )}
      <footer className={'reader-bottom ' + (chrome ? 'shown' : '')} aria-hidden={!chrome}>
        <div className="reader-status">
          <span>บท {index + 1} จาก {chapters.length} · {percent}%</span>
          <span>{percent === 100 ? 'อ่านจบบทแล้ว' : 'เหลือประมาณ ' + minutes + ' นาที'}</span>
        </div>
        <div className="progress-track"><i style={{ width: percent + '%' }} /></div>
        <div className="reader-navigation">
          <button disabled={index === 0} tabIndex={focusIndex} onClick={() => move(-1)}>
            <Icon name="back" /><span>ก่อนหน้า</span>
          </button>
          <button tabIndex={focusIndex} aria-pressed={playing} onClick={() => {
            if (playing) pause();
            else {
              setEnded(false);
              setPlaying(true);
              setChrome(false);
            }
          }}><Icon name={playing ? 'pause' : 'play'} />{playing ? 'พัก' : 'เล่น'}</button>
          <button disabled={index === chapters.length - 1} tabIndex={focusIndex}
            onClick={() => move(1)}><span>ถัดไป</span><Icon name="next" /></button>
        </div>
      </footer>
      {toc && <TableOfContents onClose={() => setToc(false)} beforeNavigate={save} />}
      {more && (
        <Sheet title="เพิ่มเติม" onClose={() => setMore(false)}>
          <button className="settings-row" onClick={() => {
            readerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
            setMore(false);
          }}><Icon name="up" /><span>กลับไปบนสุด</span><Icon name="next" /></button>
          <button className="settings-row" onClick={() => {
            setMore(false);
            leave();
          }}><Icon name="book" /><span>ข้อมูลนิยาย</span><Icon name="next" /></button>
        </Sheet>
      )}
    </section>
  );
}
