import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kayou Chat',
  description: 'Minimal real-time chat',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1',
  themeColor: '#5B8DEF',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Kayou Chat' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
