import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  channelName,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay delete-modal-overlay" onClick={onClose}>
      <div
        className="modal-content delete-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          <AlertTriangle size={24} className="delete-warning-icon" />
          <h3>Confirm Deletion</h3>
          <button className="modal-close" onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <p>Are you sure you want to delete this statistic?</p>
          <p className="channel-name-warning">
            Channel: <strong>{channelName}</strong>
          </p>
          <p className="delete-warning-text">
            This action cannot be undone. All historical data will be
            permanently deleted.
          </p>
        </div>

        <div className="delete-modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn-delete-confirm"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Channel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
