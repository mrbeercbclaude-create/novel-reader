import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { boardBlob, db, makeId, type Board, type Novel } from '../db';
import { BOARD_MAX_WIDTH, resizeImage } from '../lib/covers';
import { useBoardGestures } from '../lib/useBoardGestures';
import { useApp } from './AppContext';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

export function loadBoards(novelId: string) {
  return db.boards.where('[novelId+order]')
    .between([novelId, -Infinity], [novelId, Infinity]).toArray();
}

function useObjectUrls(boards: Board[]) {
  const urls = useMemo(
    () => Object.fromEntries(boards.map(board => [board.id, URL.createObjectURL(boardBlob(board))])),
    [boards],
  );
  useEffect(() => () => Object.values(urls).forEach(url => URL.revokeObjectURL(url)), [urls]);
  return urls;
}

// Guess a label from the file name: "thorfan-board.png" → "thorfan board".
function nameFromFile(file: File) {
  return file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 60);
}

export function CharacterBoards({ novel, onClose, onChange }: {
  novel: Novel;
  onClose: () => void;
  onChange: (count: number) => void;
}) {
  const { run } = useApp();
  const [boards, setBoards] = useState<Board[]>([]);
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const urls = useObjectUrls(boards);

  async function refresh() {
    const list = await loadBoards(novel.id);
    setBoards(list);
    onChange(list.length);
  }

  useEffect(() => {
    void run(refresh);
  }, [novel.id]);

  async function add(files: File[]) {
    const last = boards.length ? boards[boards.length - 1].order : -1;
    const images = [];
    for (const file of files) images.push(await resizeImage(file, BOARD_MAX_WIDTH));
    const buffers = await Promise.all(images.map(image => image.arrayBuffer()));
    await db.boards.bulkAdd(images.map((image, index) => ({
      id: makeId(),
      novelId: novel.id,
      name: nameFromFile(files[index]),
      order: last + 1 + index,
      image: buffers[index],
      imageType: image.type,
      createdAt: Date.now(),
    })));
    await refresh();
  }

  async function rename(board: Board) {
    const name = prompt('ชื่อตัวละคร', board.name);
    if (name === null) return;
    await db.boards.update(board.id, { name: name.trim().slice(0, 60) });
    await refresh();
  }

  async function remove(board: Board) {
    if (!confirm('ลบบอร์ด “' + (board.name || 'ไม่มีชื่อ') + '” ออกจากเรื่องนี้?')) return;
    await db.boards.delete(board.id);
    setViewing(null);
    await refresh();
  }

  async function move(board: Board, step: -1 | 1) {
    const index = boards.indexOf(board);
    const other = boards[index + step];
    if (!other) return;
    await db.transaction('rw', db.boards, async () => {
      await db.boards.update(board.id, { order: other.order });
      await db.boards.update(other.id, { order: board.order });
    });
    await refresh();
  }

  return (
    <>
      <Sheet title="ตัวละคร" onClose={onClose} className="boards-sheet">
        {!boards.length && (
          <p className="empty-state">
            ยังไม่มี character board ของเรื่องนี้ กดเพิ่มรูปด้านล่างได้เลย
          </p>
        )}
        <div className="board-grid">
          {boards.map((board, index) => (
            <button className="board-tile" key={board.id} onClick={() => setViewing(index)}>
              <img src={urls[board.id]}
                alt={board.name || 'character board'} decoding="async" />
              <span>{board.name || 'ไม่มีชื่อ'}</span>
            </button>
          ))}
        </div>
        <label className="outline-button board-add">
          <Icon name="plus" />
          {busy ? 'กำลังเพิ่มรูป…' : 'เพิ่มรูป character board'}
          <input
            className="file-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            disabled={busy}
            onChange={event => {
              const files = Array.from(event.target.files || []);
              event.target.value = '';
              if (!files.length) return;
              setBusy(true);
              void run(() => add(files)).finally(() => setBusy(false));
            }}
          />
        </label>
      </Sheet>
      {viewing !== null && boards[viewing] && (
        <BoardViewer
          boards={boards}
          urls={urls}
          index={viewing}
          onIndex={setViewing}
          onClose={() => setViewing(null)}
          onRename={board => void run(() => rename(board))}
          onRemove={board => void run(() => remove(board))}
          onMove={(board, step) => void run(async () => {
            await move(board, step);
            setViewing(viewing + step);
          })}
        />
      )}
    </>
  );
}

function BoardViewer({ boards, urls, index, onIndex, onClose, onRename, onRemove, onMove }: {
  boards: Board[];
  urls: Record<string, string>;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  onRename: (board: Board) => void;
  onRemove: (board: Board) => void;
  onMove: (board: Board, step: -1 | 1) => void;
}) {
  const board = boards[index];
  const gestures = useBoardGestures(board.id + ':' + index, step => {
    const next = index + step;
    if (next >= 0 && next < boards.length) onIndex(next);
  });

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (event.key === 'ArrowRight' && index < boards.length - 1) onIndex(index + 1);
    }
    document.addEventListener('keydown', keyboard);
    return () => document.removeEventListener('keydown', keyboard);
  }, [index, boards.length]);

  return createPortal(
    <div className="board-viewer" role="dialog" aria-modal="true" aria-label={board.name}>
      <header className="board-viewer-bar">
        <button className="icon-button" aria-label="ปิด" onClick={onClose}>
          <Icon name="close" />
        </button>
        <h2>{board.name || 'ไม่มีชื่อ'}</h2>
        <span>{index + 1} / {boards.length}</span>
      </header>
      <div
        ref={gestures.stageRef}
        className={'board-viewer-stage' + (gestures.zoomed ? ' zoomed' : '')}
        onPointerDown={gestures.onPointerDown}
        onPointerMove={gestures.onPointerMove}
        onPointerUp={gestures.onPointerUp}
        onPointerCancel={gestures.onPointerCancel}
        onLostPointerCapture={gestures.onLostPointerCapture}
      >
        <img
          ref={gestures.imageRef}
          src={urls[board.id]}
          alt={board.name || 'character board'}
          style={gestures.imageStyle}
          onLoad={gestures.onLoad}
          draggable={false}
        />
      </div>
      <footer className="board-viewer-bar">
        <button className="icon-button" aria-label="บอร์ดก่อนหน้า"
          disabled={index === 0} onClick={() => onIndex(index - 1)}>
          <Icon name="back" />
        </button>
        <button className="icon-button" aria-label="ย้ายไปก่อนหน้า"
          disabled={index === 0} onClick={() => onMove(board, -1)}>
          <Icon name="up" />
        </button>
        <button className="icon-button" aria-label="เปลี่ยนชื่อ" onClick={() => onRename(board)}>
          <Icon name="edit" />
        </button>
        <button className="icon-button" aria-label="ลบบอร์ด" onClick={() => onRemove(board)}>
          <Icon name="trash" />
        </button>
        <button className="icon-button" aria-label="บอร์ดถัดไป"
          disabled={index === boards.length - 1} onClick={() => onIndex(index + 1)}>
          <Icon name="next" />
        </button>
      </footer>
    </div>,
    document.body,
  );
}
