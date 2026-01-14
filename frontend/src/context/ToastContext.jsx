import { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Individual Toast Component
function Toast({ toast, onClose }) {
  const { type, message } = toast;

  const styles = {
    success: {
      bg: 'bg-green-50 border-green-500',
      icon: <CheckCircle className="text-green-600" size={24} />,
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-500',
      icon: <XCircle className="text-red-600" size={24} />,
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-500',
      icon: <AlertCircle className="text-yellow-600" size={24} />,
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-500',
      icon: <Info className="text-blue-600" size={24} />,
      text: 'text-blue-800'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div 
      className={`${style.bg} border-l-4 rounded-xl shadow-xl p-4 flex items-start space-x-3 animate-slideIn backdrop-blur-sm`}
    >
      <div className="flex-shrink-0">{style.icon}</div>
      <p className={`flex-1 font-semibold ${style.text} leading-relaxed`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
      >
        <X size={18} />
      </button>
    </div>
  );
}