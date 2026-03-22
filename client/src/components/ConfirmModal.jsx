import React from 'react';
import { HiOutlineExclamation, HiOutlineX } from 'react-icons/hi';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger | warning | info
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: "btn-error",
    warning: "btn-warning",
    info: "btn-primary"
  };

  const iconColors = {
    danger: "text-error bg-error/10",
    warning: "text-warning bg-warning/10",
    info: "text-primary bg-primary/10"
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box p-0 overflow-hidden border border-base-300 shadow-2xl rounded-2xl">
        <div className="p-6 flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[type]}`}>
            <HiOutlineExclamation className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="text-base-content/60">{message}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><HiOutlineX /></button>
        </div>
        
        <div className="bg-base-200 p-4 px-6 flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={onClose}>{cancelText}</button>
          <button className={`btn ${colors[type]}`} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button onClick={onClose}>close</button></form>
    </dialog>
  );
};

export default ConfirmModal;
