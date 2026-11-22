import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuickToolsHub — Free Online Tools for Everyday Tasks',
  description: 'Compress images, generate QR codes, count words, and calculate dates instantly. Free, private online tools that work in your browser.',
  keywords: ['free online tools', 'image compressor', 'QR code generator', 'word counter', 'age calculator'],
  openGraph: {
    title: 'QuickToolsHub — Free Online Tools',
    description: 'Simple, private tools for the little tasks that add up.',
    type: 'website',
  },
  generator: 'v0.app',
  applicationName: 'QuickToolsHub',
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
    <html lang="en">
      <body className="antialiased">
        <script data-cfasync="false" src="https://bicea.org/14/4fd414177dfabf70e93a699f8a69b5c7"></script>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
