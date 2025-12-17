import toast, { Toaster } from 'react-hot-toast';

export const showSuccess = (message: string) => {
  toast.success(message, {
    style: {
      borderRadius: '1rem',
      background: '#4ade80',
      color: '#fff',
      fontWeight: 500,
    },
    duration: 3000,
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    style: {
      borderRadius: '1rem',
      background: '#f87171',
      color: '#fff',
      fontWeight: 500,
    },
    duration: 4000,
  });
};

export const showInfo = (message: string) => {
  toast(message, {
    style: {
      borderRadius: '1rem',
      background: '#f3b43f',
      color: '#fff',
      fontWeight: 500,
    },
    duration: 3000,
  });
};

export const ToastProvider = () => (
  <Toaster 
    position="top-right" 
    toastOptions={{
      style: {
        padding: '16px',
      }
    }}
  />
);

