import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Notifications } from '@/components/layout/notifications'

export const metadata: Metadata = {
  title: '订单库存核查系统',
  description: '轻量订单与库存核查系统，管理客户订单、库存核查和仓库出库',
  generator: 'v0.app',
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

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh">
      <body className="antialiased">
        <Sidebar />
        {children}
        <Notifications />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
