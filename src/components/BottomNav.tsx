import { useApp } from './AppContext';
import { Icon, type IconName } from './Icon';
import type { View } from '../lib/useAppState';

const tabs: { view: View; label: string; icon: IconName }[] = [
  { view: 'library', label: 'ชั้นหนังสือ', icon: 'shelf' },
  { view: 'reading', label: 'กำลังอ่าน', icon: 'book' },
  { view: 'settings', label: 'ตั้งค่า', icon: 'settings' },
];

export function BottomNav() {
  const { view, setView } = useApp();
  return (
    <nav className="bottom-nav" aria-label="เมนูหลัก">
      {tabs.map(tab => {
        const active = view === tab.view || (view === 'details' && tab.view === 'library');
        return (
          <button
            key={tab.view}
            className={active ? 'active' : ''}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              setView(tab.view);
              window.scrollTo(0, 0);
            }}
          >
            <Icon name={tab.icon} filled={active} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

