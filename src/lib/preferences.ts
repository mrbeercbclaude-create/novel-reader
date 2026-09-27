export const defaults = {
  font: 'sans',
  size: '19',
  line: '1.9',
  spacing: '1.25',
  margin: '22',
  align: 'left',
  theme: 'light',
  awake: 'true',
  showCovers: 'true',
  autoSpeed: '3',
  autoNext: 'false',
  lastBackup: '0',
};

export type Preferences = typeof defaults;
export type PreferenceKey = keyof Preferences;

export const themes = [
  { value: 'light', label: 'สว่าง' },
  { value: 'sepia', label: 'ซีเปีย' },
  { value: 'dark', label: 'เทา' },
  { value: 'black', label: 'ดำ' },
];
