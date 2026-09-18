'use client';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from '@/components/auth/AuthForm';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function SignUpPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, isLoading, router]);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>);
    }
    return (<div>
      <h2 className="text-2xl font-bold mb-6 text-foreground">Create Account</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Join IronVault to experience secure, ACID-compliant banking transactions. Your data is protected with industry-standard encryption.
      </p>
      <AuthForm type="signup"/>
    </div>);
}
