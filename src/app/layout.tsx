import type { Metadata, Viewport } from 'next';
import { DM_Sans, Playfair_Display, DM_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-dm-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'SAFAR AI — Your world. Your budget. Your journey.',
  description: 'An intelligent personal travel platform for domestic and international journeys.',
  icons: {
    icon: './favicon.ico',
    apple: './favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable}`}>
      <head>
        <link rel="icon" href="./favicon.ico" sizes="any" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('safar_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}

                // Suppress Netlify feedback badge overlay
                function removeNetlifyDrawer() {
                  try {
                    var el = document.querySelector('netlify-drawer, #netlify-drawer, [data-netlify-drawer]');
                    if (el) el.remove();
                  } catch(e) {}
                }
                if (typeof window !== 'undefined') {
                  removeNetlifyDrawer();
                  window.addEventListener('DOMContentLoaded', removeNetlifyDrawer);
                  setInterval(removeNetlifyDrawer, 800);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-[var(--safar-bg)] text-[var(--safar-ink)] transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
