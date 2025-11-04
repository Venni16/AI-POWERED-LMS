'use client';

import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import ToastProvider from '../../components/common/ToastProvider';
import AppLoader from '../../components/common/AppLoader';

function ClientLayout({ children }: { children: React.ReactNode }) {
  

  return (
    <AppLoader>
      <ToastProvider />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-16">{children}</main>
      </div>
    </AppLoader>
  );
}

export default ClientLayout;
