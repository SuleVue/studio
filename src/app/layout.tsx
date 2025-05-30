import type { Metadata } from 'next';
import { GeistSans } from 'next/font/google'; // Corrected import for Geist Sans
import { GeistMono } from 'next/font/google'; // Corrected import for Geist Mono
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { LanguageProvider } from '@/components/providers/LanguageProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Toaster } from '@/components/ui/toaster';

const geistSans = GeistSans({ // Corrected instantiation
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({ // Corrected instantiation
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Tarik Chat',
  description: 'Intelligent Chat with Image Understanding',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <SessionProvider>
              {children}
              <Toaster />
            </SessionProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
