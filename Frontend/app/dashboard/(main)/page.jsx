'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
export default function DashboardPage() {
    const { user } = useAuth();
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Fetch account info
                const accountData = await api.account.getAccount();
                setAccount(accountData);
                // Fetch recent transactions
                const transactionsData = await api.transaction.list({
                    page: 1,
                    limit: 10,
                });
                setTransactions(transactionsData.transactions);
                // Fetch monthly stats
                const statsData = await api.account.getMonthlyStats();
                setStats(statsData);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
                setError(errorMessage);
                toast.error(errorMessage);
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    const handleRetry = () => {
        setIsLoading(true);
        setError(null);
    };
    if (error && !account) {
        return (<div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={handleRetry}>Try Again</Button>
        </div>
      </div>);
    }
    return (<div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your secure transactions with ACID guarantees
          </p>
        </div>
        <Link href="/dashboard/transfers">
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            Send Money
          </Button>
        </Link>
      </div>

      {/* Balance Card */}
      {account && (<BalanceCard balanceCents={account.balanceCents} accountNumber={account.accountNumber} isLoading={isLoading}/>)}

      {/* Stats Section */}
      {stats && (<StatsSection totalSentCents={stats.totalSentCents} totalReceivedCents={stats.totalReceivedCents} transferCount={stats.transferCount} isLoading={isLoading}/>)}

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} isLoading={isLoading}/>
    </div>);
}
