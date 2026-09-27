import { useState } from 'react';
import { useApp } from '../components/AppContext';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { themes } from '../lib/preferences';
import { BackupControls } from '../components/BackupControls';

export function Settings() {
  const { prefs, updatePref, setShowAppearance, run } = useApp();
  const [help, setHelp] = useState(false);
  const theme = themes.find(item => item.value === prefs.theme)?.label || 'สว่าง';

  return (
    <section className="settings-screen">
      <header className="page-header"><h1>ตั้งค่า</h1></header>
      <div className="settings-content">
        <h2>การอ่านและการแสดงผล</h2>
        <div className="settings-group">
          <button className="settings-row" onClick={() => setShowAppearance(true)}>
            <span>รูปแบบหน้าอ่าน</span>
            <small>{prefs.size} px</small>
            <Icon name="next" />
          </button>
          <button className="settings-row" onClick={() => setShowAppearance(true)}>
            <span>ธีมสีหน้าอ่าน</span>
            <small>{theme}</small>
            <Icon name="next" />
          </button>
          <label className="settings-row">
            <span>แสดงรูปปก</span>
            <input
              className="switch"
              type="checkbox"
              role="switch"
              checked={prefs.showCovers === 'true'}
              onChange={e => void run(() => updatePref('showCovers', String(e.target.checked)))}
            />
          </label>
          <label className="settings-row">
            <span>เปิดหน้าจอไว้ขณะอ่าน</span>
            <input
              className="switch"
              type="checkbox"
              role="switch"
              checked={prefs.awake === 'true'}
              onChange={e => void run(() => updatePref('awake', String(e.target.checked)))}
            />
          </label>
        </div>
        <p className="settings-note">การเปิดหน้าจอไว้ขึ้นอยู่กับอุปกรณ์และเบราว์เซอร์ที่ใช้</p>
        <h2>ข้อมูลในอุปกรณ์</h2>
        <BackupControls />
        <div className="settings-group">
          <button className="settings-row" onClick={() => setHelp(true)}>
            <span>การเก็บข้อมูลและอ่านออฟไลน์</span>
            <Icon name="next" />
          </button>
        </div>
        <p className="settings-note">
          ไม่มีบัญชีผู้ใช้ ไม่มีการส่งนิยายหรือรูปปกออกจากอุปกรณ์
        </p>
      </div>
      {help && (
        <Sheet title="ข้อมูลในอุปกรณ์" onClose={() => setHelp(false)}>
          <div className="help-copy">
            <p>นิยาย รูปปก บุ๊กมาร์ก และตำแหน่งที่อ่านเก็บอยู่ในเบราว์เซอร์นี้เท่านั้น</p>
            <p>
              การล้างข้อมูลเว็บไซต์หรือเปลี่ยนเบราว์เซอร์อาจทำให้ข้อมูลหาย
              โปรดเก็บไฟล์ต้นฉบับไว้สำรองด้วย
            </p>
            <p>
              เมื่อติดตั้งผ่านเว็บไซต์ HTTPS แอปและฟอนต์จะถูกเก็บไว้เพื่ออ่านออฟไลน์
              การทดสอบผ่าน Wi-Fi ด้วย HTTP ยังไม่รองรับการติดตั้งออฟไลน์
            </p>
          </div>
        </Sheet>
      )}
    </section>
  );
}
