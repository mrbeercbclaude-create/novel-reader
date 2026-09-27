import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Sheet({ title, children, onClose, className = '' }: Props) {
  const headingId = useId();
  const panel = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const focused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const app = document.querySelector<HTMLElement>('.app');
    const previousInert = app?.inert || false;
    document.body.style.overflow = 'hidden';
    if (app) app.inert = true;
    panel.current?.focus();

    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const selector = 'button, input, textarea, select, [tabindex="0"]';
      const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>(selector) || [])
        .filter(element => !element.hasAttribute('disabled') && element.getClientRects().length);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first
        || document.activeElement === panel.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (app) app.inert = previousInert;
      document.removeEventListener('keydown', keyboard);
      focused?.focus();
    };
  }, []);

  return createPortal(
    <div className="sheet-backdrop" onClick={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className={'sheet ' + className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        ref={panel}
      >
        <header className="sheet-header">
          <button className="icon-button" aria-label="ปิด" onClick={onClose}>
            <Icon name="close" />
          </button>
          <h2 id={headingId}>{title}</h2>
        </header>
        <div className="sheet-body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

