'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
        success: {
          iconTheme: {
            primary: '#000',
            secondary: '#fff',
          },
        },
      }}
    />
  );
};

export default ToastProvider;