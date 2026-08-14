import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'

export const metadata: Metadata = {
  title: 'Product Catalog',
  description: 'Browse and order products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  )
}
