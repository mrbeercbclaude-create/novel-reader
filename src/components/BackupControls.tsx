import { useEffect, useState } from 'react';
import { useApp } from './AppContext';
import { Sheet } from './Sheet';
import { exportLibrary, restoreLibrary } from '../lib/backup';
import { parseBackup, type BackupData } from '../lib/backupFormat';

export function BackupReminder() {
  const { novels, prefs, setView } = useApp();
  const oldest = Math.min(...novels.map(novel => novel.createdAt));
  const since = Number(prefs.lastBackup) || oldest;
  if (!novels.length || Date.now() - since < 14 * 86400000) return null;
  return (
    <aside className="backup-reminder">
      <p>ไม่ได้สำรองข้อมูลมาสักพักแล้ว เก็บสำเนานิยายไว้สักชุดไหม</p>
      <button className="plain-button" onClick={() => setView('settings')}>
        ไปสำรองข้อมูล
      </button>
    </aside>
  );
}

export function BackupControls() {
  const { prefs, updatePref, reload, run } = useApp();
  const [pending, setPending] = useState<BackupData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [exportBlob, setExportBlob] = useState<Blob | null>(null);
  const [exportUrl, setExportUrl] = useState('');
  const [persistent, setPersistent] = useState('กำลังตรวจสอบการเก็บข้อมูล');

  async function requestStorage() {
    try {
      if (!navigator.storage?.persist) {
        setPersistent('เบราว์เซอร์นี้ยังไม่รองรับการขอพื้นที่ถาวร');
        return;
      }
      const granted = await navigator.storage.persisted() || await navigator.storage.persist();
      setPersistent(granted ? 'ได้รับพื้นที่จัดเก็บถาวรแล้ว'
        : 'เบราว์เซอร์ยังไม่อนุญาตพื้นที่ถาวร โปรดสำรองข้อมูลเป็นระยะ');
    } catch {
      setPersistent('ยังขอพื้นที่ถาวรไม่ได้ โปรดสำรองข้อมูลเป็นระยะ');
    }
  }

  useEffect(() => { void requestStorage(); }, []);
  useEffect(() => {
    if (!exportBlob) return;
    const url = URL.createObjectURL(exportBlob);
    setExportUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [exportBlob]);

  async function work(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    await run(action);
    setBusy(false);
  }

  async function restore(mode: 'merge' | 'replace') {
    if (!pending) return;
    const prompt = mode === 'replace'
      ? 'แทนที่ข้อมูลทั้งหมดในเบราว์เซอร์นี้ด้วยไฟล์สำรอง? ข้อมูลเดิมจะถูกลบและย้อนกลับไม่ได้'
      : 'เพิ่มนิยายจากไฟล์สำรองเป็นสำเนาใหม่ โดยเก็บนิยายเดิมทั้งหมดไว้?';
    if (!confirm(prompt)) return;
    await work(async () => {
      await restoreLibrary(pending, mode);
      await reload();
      setPending(null);
      setMessage('นำเข้าไฟล์สำรองเรียบร้อยแล้ว');
    });
  }

  return (
    <>
      <BackupReminder />
      <div className="settings-group">
        <button className="settings-row" disabled={busy} onClick={() => void work(async () => {
          setExportBlob(await exportLibrary());
          setMessage('ไฟล์พร้อมแล้ว แตะดาวน์โหลดเพื่อเก็บสำเนาไว้ในที่ปลอดภัย');
        })}><span>สำรองทั้งชั้นหนังสือ (.json)</span></button>
        <label className="settings-row backup-upload">
          <span>นำเข้าไฟล์สำรอง (.json)</span>
          <input type="file" accept=".json,application/json" disabled={busy}
            onChange={event => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void work(async () => setPending(await parseBackup(file)));
            }} />
        </label>
        <button className="settings-row" onClick={() => void requestStorage()}>
          <span>ขอพื้นที่จัดเก็บถาวร</span>
        </button>
      </div>
      {exportUrl && (
        <a className="primary-button backup-download" href={exportUrl}
          download={'novel-backup-' + new Date().toISOString().slice(0, 10) + '.json'}
          onClick={() => void run(() => updatePref('lastBackup', String(Date.now())))}>
          ดาวน์โหลดไฟล์สำรอง
        </a>
      )}
      <p className="settings-note" role="status">{persistent}</p>
      <p className="settings-note">
        {Number(prefs.lastBackup) > 0
          ? 'ส่งออกล่าสุด ' + new Date(Number(prefs.lastBackup)).toLocaleDateString('th-TH')
          : 'ยังไม่เคยส่งออกไฟล์สำรอง'}
        {' · รวมเนื้อหา รูปปก บุ๊กมาร์ก และตำแหน่งที่อ่าน (สูงสุด 150 MB)'}
      </p>
      <p className="settings-note">พื้นที่ถาวรไม่ป้องกันการล้างข้อมูลเว็บไซต์ เก็บไฟล์สำรองแยกไว้ด้วย</p>
      {message && <p className="settings-note" role="status">{message}</p>}
      {pending && (
        <Sheet title="นำเข้าไฟล์สำรอง" onClose={() => { if (!busy) setPending(null); }}>
          <div className="restore-options">
            <p>{pending.novels.length} เรื่อง · {pending.chapters.length} บท</p>
            <p>รวมข้อมูล: เพิ่มเป็นสำเนาใหม่ เก็บนิยายและการตั้งค่าเดิมไว้</p>
            <button className="primary-button" disabled={busy}
              onClick={() => void restore('merge')}>รวมข้อมูล</button>
            <p>แทนที่: ลบข้อมูลเดิมทั้งหมด แล้วใช้ข้อมูลและการตั้งค่าจากไฟล์นี้</p>
            <button className="outline-button" disabled={busy}
              onClick={() => void restore('replace')}>แทนที่ข้อมูลทั้งหมด</button>
          </div>
        </Sheet>
      )}
    </>
  );
}
