import type { Metadata } from 'next'
import { AuthProvider } from '../../context/AuthContext'
import ClientLayout from './ClientLayout'
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
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
