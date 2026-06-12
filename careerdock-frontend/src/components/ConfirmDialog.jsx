import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiAlertLine, RiDeleteBinLine, RiCloseLine } from 'react-icons/ri';

function ConfirmDialog({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true, onConfirm, onCancel }) {
  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onCancel()}
        style={{ zIndex: 2000 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          style={{
            background: 'var(--cardBg)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border)',
            borderRadius: 18,
            padding: '32px 28px 24px',
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 32px 80px rgba(0,0,0,0.28)',
            position: 'relative',
          }}
        >
          {/* Close X */}
          <button
            onClick={onCancel}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '4px 6px', cursor: 'pointer',
              color: 'var(--muted)', display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            <RiCloseLine size={15} />
          </button>

          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(var(--primaryRgb,61,84,53),0.12)',
            border: `1.5px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(61,84,53,0.2)'}`,
            marginBottom: 18,
          }}>
            {danger
              ? <RiDeleteBinLine size={22} style={{ color: '#ef4444' }} />
              : <RiAlertLine size={22} style={{ color: 'var(--primary)' }} />
            }
          </div>

          {/* Text */}
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8, lineHeight: 1.3 }}>
            {title}
          </h3>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 26 }}>
            {message}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              className="btn btn-outline"
              style={{ flex: 1, justifyContent: 'center', fontSize: 13.5 }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="btn"
              style={{
                flex: 1, justifyContent: 'center', fontSize: 13.5, fontWeight: 600,
                background: danger
                  ? 'linear-gradient(135deg,#C62828,#E53935)'
                  : 'linear-gradient(135deg,var(--primary),var(--accent))',
                color: '#fff',
                boxShadow: danger ? '0 4px 14px rgba(239,68,68,0.3)' : '0 4px 14px rgba(0,0,0,0.15)',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: true, resolve: null });

  const confirm = ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true }) =>
    new Promise(resolve => {
      setState({ open: true, title, message, confirmLabel, cancelLabel, danger, resolve });
    });

  const handleClose = (result) => {
    setState(s => { s.resolve?.(result); return { ...s, open: false }; });
  };

  const dialog = state.open ? (
    <ConfirmDialog
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      danger={state.danger}
      onConfirm={() => handleClose(true)}
      onCancel={() => handleClose(false)}
    />
  ) : null;

  return { confirm, dialog };
}
