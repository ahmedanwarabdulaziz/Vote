import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام انتخابات النادي',
  description: 'نظام عد الأصوات وعرض النتائج في الوقت الفعلي',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}

