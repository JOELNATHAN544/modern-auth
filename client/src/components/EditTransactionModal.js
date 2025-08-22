import React, { useEffect, useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";

const EditTransactionModal = ({ open, transaction, onSave, onCancel }) => {
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(String(transaction?.amount ?? ""));
      setDescription(transaction?.description ?? "");
      lastFocused.current = document.activeElement;
      setTimeout(() => dialogRef.current?.focus(), 0);
      const handleKey = (e) => {
        if (e.key === "Escape") onCancel?.();
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    } else if (lastFocused.current) {
      lastFocused.current.focus?.();
    }
  }, [open, transaction, onCancel]);

  if (!open) return null;

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-title"
    >
      <div
        className="modal-content"
        ref={dialogRef}
        tabIndex={-1}
        style={{ outline: "none" }}
      >
        <div className="modal-header">
          <h3 id="edit-title" className="modal-title">
            Edit Transaction
          </h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <div>
          <div className="form-group">
            <label className="form-label">Amount (€)</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={() => setShowConfirm(true)}
          >
            Save
          </button>
        </div>
      </div>
      <ConfirmModal
        open={showConfirm}
        title="Save changes?"
        body={`Save changes to this transaction for €${Number(amount || 0).toFixed(2)} — ${description}?`}
        confirmText="Save"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onSave({ amount: parseFloat(amount), description });
        }}
      />
    </div>
  );
};

export default EditTransactionModal;
