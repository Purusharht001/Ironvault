'use client';
import { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { StatsSection } from '@/components/dashboard/StatsSection';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
export default function DashboardPage() {
    const { user } = useAuth();
    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [accountData, transactionsData, statsData, activityData] = await Promise.all([
                api.account.getAccount(),
                api.transaction.list({ page: 1, limit: 5 }),
                api.account.getMonthlyStats(),
                api.account.getActivity(30),
            ]);
            setAccount(accountData);
            setTransactions(transactionsData.transactions);
            setStats(statsData);
            setActivity(activityData.series);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
            setError(errorMessage);
            toast.error(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    if (error && !account) {
        return (<div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>);
    }
    return (<div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {user?.username}
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your secure transactions with ACID guarantees
          </p>
        </div>
        <Link href="/dashboard/transfers">
          <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4 mr-2" aria-hidden="true"/>
            Send Money
          </Button>
        </Link>
      </div>

      {/* Balance Card */}
      <BalanceCard balanceCents={account?.balanceCents ?? 0} accountNumber={account?.accountNumber ?? ''} isLoading={isLoading && !account}/>

      {/* Stats Section */}
      <StatsSection totalSentCents={stats?.totalSentCents ?? 0} totalReceivedCents={stats?.totalReceivedCents ?? 0} transferCount={stats?.transferCount ?? 0} isLoading={isLoading && !stats}/>

      {/* 30-day cash flow */}
      <ActivityChart series={activity} isLoading={isLoading && activity.length === 0}/>

      {/* Recent Transactions */}
      <RecentTransactions transactions={transactions} isLoading={isLoading && transactions.length === 0}/>
    </div>);
}
