import React from 'react';
import ModalOverlay from './ModalOverlay';

interface LoadingModalProps {
  open: boolean;
  label: string;
}

export default function LoadingModal({ open, label }: LoadingModalProps) {
  if (!open) return null;

  return (
    <ModalOverlay onClick={(e) => e.stopPropagation()}>
      <div className="loading-modal-card">
        <md-circular-progress indeterminate />
        <p className="loading-modal-label">{label}</p>
      </div>
    </ModalOverlay>
  );
}
