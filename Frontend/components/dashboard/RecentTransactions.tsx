'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Transaction } from '@/lib/types';
import { FORMATS } from '@/lib/constants';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

export function RecentTransactions({
  transactions,
  isLoading = false,
}: RecentTransactionsProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      SUCCESS: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.PENDING;
  };

  const getDirectionIcon = (type: string) => {
    return type === 'SEND' ? '📤' : '📥';
  };

  const formatAmount = (cents: number) => {
    const dollars = (cents / FORMATS.CENT_DIVISOR).toFixed(
      FORMATS.DECIMAL_PLACES
    );
    return `${FORMATS.CURRENCY_SYMBOL}${dollars}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Recent Transactions
        </h2>
        <Link href="/dashboard/transactions">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No transactions yet. Send your first transfer to get started!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Amount
                </th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Account
                </th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-2">
                    <span className="text-lg">
                      {getDirectionIcon(transaction.type)}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-semibold">
                    {transaction.type === 'SEND' ? '-' : '+'}
                    {formatAmount(transaction.amountCents)}
                  </td>
                  <td className="py-3 px-2 font-mono text-xs">
                    {transaction.type === 'SEND'
                      ? transaction.receiverAccountNumber
                      : transaction.senderAccountNumber}
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground text-xs">
                    {formatDate(transaction.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
