import React, { useEffect, useRef, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

const TransactionCard = ({ transaction, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const itemRefs = [useRef(null), useRef(null)];
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none)').matches;

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        buttonRef.current?.focus();
      }
      if (menuOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = (activeIndex + 1) % itemRefs.length;
          setActiveIndex(next);
          itemRefs[next].current?.focus();
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = (activeIndex - 1 + itemRefs.length) % itemRefs.length;
          setActiveIndex(prev);
          itemRefs[prev].current?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const amt = Number(transaction.amount) || 0;
  const createdAt = transaction.created_at || transaction.timestamp;

  return (
    <div
      className="card"
      style={{ background: '#2a2a2a', padding: '16px', border: '1px solid #444', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontWeight: '600' }}>€{amt.toFixed(2)}</span>
        {transaction.statusPill}
      </div>

      <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '8px' }}>
        {transaction.description}
      </p>

      <div className="flex items-center justify-between">
        <span style={{ fontSize: '12px', color: '#888' }}>
          {createdAt ? new Date(createdAt).toLocaleString() : ''}
        </span>
      </div>

      {/* Kebab Button */}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`More actions for €${amt.toFixed(2)} — ${transaction.description}`}
        title="More actions"
        onClick={() => setMenuOpen(!menuOpen)}
        className="btn btn-secondary"
        style={{
          position: 'absolute',
          right: '10px',
          bottom: '10px',
          width: '32px',
          height: '32px',
          padding: 0,
          borderRadius: '50%',
          opacity: isMobile || menuOpen || hovered ? 1 : 0,
        }}
      >
        <MoreVertical size={18} />
      </button>

      {/* Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="card"
          style={{
            position: 'absolute',
            right: '10px',
            bottom: '50px',
            minWidth: '160px',
            background: '#1f1f1f',
            border: '1px solid #333',
            zIndex: 20,
          }}
        >
          <button
            role="menuitem"
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            ref={itemRefs[0]}
            onClick={() => {
              setMenuOpen(false);
              onEdit?.(transaction.id, transaction);
            }}
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            role="menuitem"
            className="btn btn-danger"
            style={{ width: '100%', justifyContent: 'flex-start', marginTop: '6px' }}
            ref={itemRefs[1]}
            onClick={() => {
              setMenuOpen(false);
              onDelete?.(transaction.id, transaction);
            }}
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;


