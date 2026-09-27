import { AppContext } from './components/AppContext';
import { BottomNav } from './components/BottomNav';
import { Icon } from './components/Icon';
import { Appearance } from './components/Appearance';
import { useAppState } from './lib/useAppState';
import { Library } from './screens/Library';
import { NovelDetails } from './screens/NovelDetails';
import { Reader } from './screens/Reader';
import { Import } from './screens/Import';
import { Settings } from './screens/Settings';

export function App() {
  const state = useAppState();
  return (
    <AppContext.Provider value={state}>
      <main className={'app view-' + state.view}>
        {(state.view === 'library' || state.view === 'reading') && <Library />}
        {state.view === 'details' && <NovelDetails />}
        {state.view === 'reader' && <Reader />}
        {state.view === 'settings' && <Settings />}
        {state.view !== 'reader' && <BottomNav />}
      </main>
      {state.showImport && <Import />}
      {state.showAppearance && <Appearance />}
      {state.error && (
        <div className="error-notice" role="alert">
          <span>{state.error}</span>
          <button className="icon-button" aria-label="ปิดข้อความ"
            onClick={() => state.setError('')}>
            <Icon name="close" />
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
