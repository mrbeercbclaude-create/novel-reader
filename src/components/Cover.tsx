import { useEffect, useState } from 'react';
import type { Novel } from '../db';
import { coverColor } from '../lib/covers';
import { useApp } from './AppContext';

export function Cover({ novel, hero = false }: { novel: Novel; hero?: boolean }) {
  const { covers, prefs } = useApp();
  const blob = prefs.showCovers === 'true' ? covers[novel.id] : undefined;
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  const className = ['cover', hero ? 'cover-hero' : '', blob && url ? 'has-image' : '']
    .filter(Boolean).join(' ');

  return (
    <div className={className} style={{ backgroundColor: coverColor(novel.id) }}>
      {blob && url ? (
        <img src={url} alt={'ปก ' + novel.title} loading={hero ? 'eager' : 'lazy'} />
      ) : (
        <div className="cover-type">
          <strong>{novel.title}</strong>
          <span>{novel.author || 'ไม่ระบุผู้เขียน'}</span>
        </div>
      )}
    </div>
  );
}

