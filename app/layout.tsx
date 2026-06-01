import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeScope } from '@/components/theme-scope'
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
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
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
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="pontify-theme"
          disableTransitionOnChange
        >
          <ThemeScope>
            <AuthProvider>
              {children}
              <Toaster />
              <WebVitalsReporter />
            </AuthProvider>
          </ThemeScope>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
