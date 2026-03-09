import { useEffect, useRef } from 'react';
import styles from './ResponsiveModal.module.css';

type ResponsiveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
};

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  ariaLabel,
  children,
}: ResponsiveModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const headingId = title ? 'responsive-modal-title' : undefined;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-label={headingId ? undefined : ariaLabel}
      onClick={handleBackdropClick}
    >
      <div ref={panelRef} className={styles.panel}>
        {(title || onClose) && (
          <div className={styles.header}>
            {title ? (
              <h2 id={headingId} className={styles.title}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

