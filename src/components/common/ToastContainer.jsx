import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(({ id, message, type }) => {
        const Icon = ICONS[type] || Info;
        return (
          <div key={id} className={`toast toast--${type}`} role="status">
            <Icon size={18} />
            <span>{message}</span>
            <button className="toast__close" onClick={() => onDismiss(id)} aria-label="Đóng thông báo">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
