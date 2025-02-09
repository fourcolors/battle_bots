import { toast as sonnerToast } from 'sonner';

// Default toast configuration
export const toastConfig = {
  position: 'bottom-right' as const,
  theme: 'dark' as const,
  closeButton: true,
  richColors: true,
  duration: 4000,
};

// Toast utility functions
export const toast = {
  error: (message: string) => {
    sonnerToast.error(message);
  },
  success: (message: string) => {
    sonnerToast.success(message);
  },
  info: (message: string) => {
    sonnerToast.info(message);
  },
  warning: (message: string) => {
    sonnerToast.warning(message);
  },
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },
  promise: async <T,>(
    promise: Promise<T>,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Something went wrong',
    }: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
}; 