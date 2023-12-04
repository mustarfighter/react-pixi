import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  weight: ["400", "700"],
  subsets: ['latin-ext']
})

export const metadata: Metadata = {
  title: 'PixiJS + React Starter',
  description: 'Cropper',
  keywords: 'pixijs, react, starter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
