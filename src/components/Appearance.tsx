import { useApp } from './AppContext';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { defaults, themes, type PreferenceKey } from '../lib/preferences';

export function Appearance() {
  const { prefs, updatePref, setShowAppearance, run } = useApp();
  const change = (key: PreferenceKey, value: string) => void run(() => updatePref(key, value));
  const size = Number(prefs.size);

  return (
    <Sheet
      title="ตั้งค่าหน้าอ่าน"
      onClose={() => setShowAppearance(false)}
      className="appearance-sheet"
    >
      <div className="appearance-controls">
        <label className="settings-row">
          <span>เล่นตอนถัดไปอัตโนมัติ</span>
          <input className="switch" type="checkbox" role="switch"
            checked={prefs.autoNext === 'true'}
            onChange={e => change('autoNext', String(e.target.checked))} />
        </label>
        <label className="control-group">
          <span>ฟอนต์</span>
          <select value={prefs.font} onChange={e => change('font', e.target.value)}>
            <option value="sans">Noto Sans Thai</option>
            <option value="sarabun">Sarabun</option>
            <option value="serif">Noto Serif Thai</option>
            <option value="system">ฟอนต์ของอุปกรณ์</option>
          </select>
        </label>
        <div className="control-group">
          <div className="control-label">
            <span>ขนาดตัวอักษร</span>
            <output>{prefs.size} px</output>
          </div>
          <div className="size-controls">
            <button
              aria-label="ลดขนาดตัวอักษร"
              disabled={size <= 15}
              onClick={() => change('size', String(Math.max(15, size - 1)))}
            >Aa−</button>
            <button
              aria-label="เพิ่มขนาดตัวอักษร"
              disabled={size >= 30}
              onClick={() => change('size', String(Math.min(30, size + 1)))}
            >Aa+</button>
            <button aria-label="คืนขนาดเริ่มต้น" onClick={() => change('size', defaults.size)}>
              <Icon name="reset" />
            </button>
          </div>
          <input
            type="range"
            aria-label="ขนาดตัวอักษร"
            min="15"
            max="30"
            value={prefs.size}
            onChange={e => change('size', e.target.value)}
          />
        </div>
        <div className="control-group">
          <span>ธีมสี</span>
          <div className="theme-swatches">
            {themes.map(theme => (
              <button
                key={theme.value}
                className={'theme-swatch swatch-' + theme.value}
                aria-label={theme.label}
                aria-pressed={prefs.theme === theme.value}
                onClick={() => change('theme', theme.value)}
              >
                <span>ก</span>
                {prefs.theme === theme.value && <Icon name="check" />}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group">
          <span>ระยะห่างบรรทัด</span>
          <div className="spacing-buttons">
            {['1.6', '1.9', '2.2'].map((value, index) => (
              <button
                key={value}
                aria-label={['กระชับ', 'ปกติ', 'โปร่ง'][index]}
                aria-pressed={prefs.line === value}
                onClick={() => change('line', value)}
              >
                <span className={'line-sample spacing-' + index}>
                  <i /><i /><i />
                </span>
              </button>
            ))}
          </div>
        </div>
        <details className="advanced-settings">
          <summary>ตั้งค่าเพิ่มเติม</summary>
          <label className="control-group">
            <span>ระยะบรรทัดแบบละเอียด · {prefs.line}</span>
            <input
              type="range"
              min="1.5"
              max="2.5"
              step="0.1"
              value={prefs.line}
              onChange={e => change('line', e.target.value)}
            />
          </label>
          <label className="control-group">
            <span>ช่องไฟย่อหน้า · {prefs.spacing}</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.25"
              value={prefs.spacing}
              onChange={e => change('spacing', e.target.value)}
            />
          </label>
          <label className="control-group">
            <span>ขอบหน้า · {prefs.margin} px</span>
            <input
              type="range"
              min="12"
              max="48"
              value={prefs.margin}
              onChange={e => change('margin', e.target.value)}
            />
          </label>
          <label className="control-group">
            <span>จัดข้อความ</span>
            <select value={prefs.align} onChange={e => change('align', e.target.value)}>
              <option value="left">ชิดซ้าย</option>
              <option value="justify">เต็มบรรทัด</option>
            </select>
          </label>
        </details>
      </div>
    </Sheet>
  );
}
