'use client';

import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import ToastProvider from '../../components/common/ToastProvider';
import AppLoader from '../../components/common/AppLoader';
import Chatbot from '../../components/common/Chatbot';

function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <AppLoader>
      <ToastProvider />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="pt-16">{children}</main>
        {user && user.role === 'student' && <Chatbot currentUser={user} />}
      </div>
    </AppLoader>
  );
}

export default ClientLayout;
