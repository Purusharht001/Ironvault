import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });
export const metadata = {
    title: 'IronVault - Secure Transaction Banking',
    description: 'IronVault: A fintech simulator focused on transaction integrity, ACID guarantees, and immutable transaction history.',
    generator: 'v0.app',
};
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: '#1f2937',
};
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>);
}
