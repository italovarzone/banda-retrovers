import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  metadataBase: new URL('https://retrovers.com.br'),
  title: {
    default: 'Banda Retrovers',
    template: '%s | Banda Retrovers',
  },
  description: 'Rock nacional dos anos 80, 90 e 2000 — shows em formatos acústico e elétrico em Araras, Leme e região.',
  keywords: [
    'Retrovers', 'Banda Retrovers', 'banda', 'rock nacional', 'anos 80', 'anos 90', 'anos 2000', 'cover', 'acústico', 'elétrico', 'Araras', 'Leme', 'SP', 'show ao vivo'
  ],
  authors: [
    { name: 'Ítalo Varzone' },
    { name: 'Davi Ligero' },
    { name: 'Matheus Frugis' }
  ],
  creator: 'Banda Retrovers',
  publisher: 'Banda Retrovers',
  category: 'music',
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': 'https://retrovers.com.br/',
      'x-default': 'https://retrovers.com.br/',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://retrovers.com.br/',
    title: 'Banda Retrovers',
    siteName: 'Banda Retrovers',
    description: 'Rock nacional dos anos 80, 90 e 2000 — acústico e elétrico.',
    images: [
      { url: '/logo.png', width: 1200, height: 630, alt: 'Banda Retrovers' }
    ],
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Banda Retrovers',
    description: 'Rock nacional dos anos 80, 90 e 2000 — acústico e elétrico.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined,
    },
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
