import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kayou Chat',
  description: 'Minimal real-time chat',
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
