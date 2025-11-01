import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
  };

  return { showSuccess, showError, showLoading, dismissToast };
};