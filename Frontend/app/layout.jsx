import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'sonner';
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });
export const metadata = {
    title: 'IronVault - Secure Transaction Banking',
    description: 'IronVault: A fintech simulator focused on transaction integrity, ACID guarantees, and immutable transaction history.',
};
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#1f2937',
};
export default function RootLayout({ children, }) {
    return (<html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-center"/>
      </body>
    </html>);
}
