import type { Metadata } from 'next'
import { AuthProvider } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI-Powered LMS',
  description: 'Learning Management System with AI Video Summarization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}