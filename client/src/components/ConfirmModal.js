import React, { useEffect, useRef } from 'react';

const ConfirmModal = ({
  open,
  title,
  body,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (open) {
      lastFocused.current = document.activeElement;
      setTimeout(() => dialogRef.current?.focus(), 0);
      const handleKey = (e) => {
        if (e.key === 'Escape') onCancel?.();
      };
      window.addEventListener('keydown', handleKey);
      return () => window.removeEventListener('keydown', handleKey);
    } else if (lastFocused.current) {
      lastFocused.current.focus?.();
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-content" ref={dialogRef} tabIndex={-1} style={{ outline: 'none' }}>
        <div className="modal-header">
          <h3 id="confirm-title" className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        <div style={{ marginBottom: '16px', color: '#ccc' }}>{body}</div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button
            className={`btn ${destructive ? 'btn-danger' : 'btn-success'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;


