'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/dashboard/Navbar';
import { MobileNav, Sidebar } from '@/components/dashboard/Sidebar';
export default function DashboardLayout({ children, }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    // Redirect to signin if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/signin');
        }
    }, [isAuthenticated, isLoading, router]);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>);
    }
    if (!isAuthenticated) {
        return null;
    }
    return (<div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 pb-24 sm:p-6 sm:pb-24 md:p-8">
          {children}
        </main>
      </div>

      {/* Bottom navigation on small screens */}
      <MobileNav />
    </div>);
}
