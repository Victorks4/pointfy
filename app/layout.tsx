import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { PontifyThemeProvider } from '@/components/pontify-theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { WebVitalsReporter } from '@/components/web-vitals-reporter'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sistema de Presença Digital',
  description: 'Sistema de Gestão de Presença Digital para Estagiários',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className={`${geistSans.className} min-h-dvh font-sans antialiased`}>
        <PontifyThemeProvider>
          <AuthProvider>
            {children}
            <Toaster />
            <WebVitalsReporter />
          </AuthProvider>
        </PontifyThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
