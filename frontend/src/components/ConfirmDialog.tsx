import React from "react";
import ModalWrapper from "./ModalWrapper";

type Props = {
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
};

export const ConfirmDialog: React.FC<Props> = ({
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isProcessing = false,
}) => {
  return (
    <ModalWrapper title={title} onClose={onCancel}>
      <div className="p-6">
        {description && <p className="text-sm text-slate-300 mb-6 leading-relaxed">{description}</p>}

        <div className="flex gap-3">
          <button className="flex-1 bg-panel-alt hover:bg-surface-soft text-slate-100 font-semibold py-2.5 px-4 rounded-lg transition-colors" onClick={onCancel} disabled={isProcessing}>
            {cancelLabel}
          </button>
          <button className="flex-1 btn-danger" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmDialog;
