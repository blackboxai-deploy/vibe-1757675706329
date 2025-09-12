import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Smart Bookmark Search - Firefox Extension Demo',
  description: 'Transform your Firefox bookmarks into an intelligent search engine that searches through the actual content of your bookmarked pages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {children}
      </body>
    </html>
  )
}