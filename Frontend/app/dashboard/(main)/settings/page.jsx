'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { ProfileSection } from '@/components/dashboard/ProfileSection';
import { SecuritySection } from '@/components/dashboard/SecuritySection';
export default function SettingsPage() {
    const { user } = useAuth();
    const [account, setAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const accountData = await api.account.getAccount();
                setAccount(accountData);
            }
            catch (error) {
                console.error('Failed to fetch account:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchAccount();
    }, []);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>);
    }
    return (<div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account profile and security settings
        </p>
      </div>

      {/* Profile Section */}
      <ProfileSection user={user} account={account}/>

      {/* Security Section */}
      <SecuritySection />
    </div>);
}
