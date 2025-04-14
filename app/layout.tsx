import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/contexts/auth-context';
import { ToastProvider } from '@/hooks/toast-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chaty - Modern Messaging Platform',
  description: 'Connect with friends and the world around you with Chaty.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <ToastProvider>
          <ThemeProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
