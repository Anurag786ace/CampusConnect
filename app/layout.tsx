import type { Metadata } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import { StoreProvider } from '@/components/StoreProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import NavigationLogger from '@/components/NavigationLogger'

export const metadata: Metadata = {
  title: 'Campus Connect',
  description: 'Find and register for events happening on campus.',
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
          <StoreProvider>
            <Suspense fallback={null}>
              <NavigationLogger />
            </Suspense>
            <Navbar />
            <main style={{ minHeight: '70vh' }}>{children}</main>
            <Footer />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

