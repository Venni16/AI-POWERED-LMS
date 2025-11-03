import type { Metadata } from 'next'
import { AuthProvider } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import ToastProvider from '../../components/common/ToastProvider'
import AppLoader from '../../components/common/AppLoader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vortex',
  description: 'Learning Management System with AI Video Summarization',
  icons: '/webtitleimg1.jpg',
  
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppLoader>
        <AuthProvider>
          <ToastProvider />
          <div className="min-h-screen bg-white">
            <Navbar />
            <main className="pt-16">{children}</main>
          </div>
        </AuthProvider>
        </AppLoader>
      </body>
    </html>
  )
}