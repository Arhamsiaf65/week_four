import React from "react";
import { X } from "lucide-react";

type Props = {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
};

export const ModalWrapper: React.FC<Props> = ({ title, onClose, children, className = "w-full max-w-md" }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-surface-strong border border-surface rounded-2xl ${className} shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="px-6 py-4 border-b border-surface flex justify-between items-center bg-surface">
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            <button className="text-slate-400 hover:text-slate-100 hover:bg-surface-soft p-1.5 rounded-full transition-colors" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default ModalWrapper;
