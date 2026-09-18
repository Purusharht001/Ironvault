'use client';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAccountNumber, formatCents, formatDateTime } from '@/lib/utils';
import { counterpartyLabel, DirectionIcon, signedAmountClass, StatusBadge } from './TransactionBits';
export function RecentTransactions({ transactions, isLoading = false, }) {
    return (<Card className="p-6">
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

      {isLoading ? (<div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (<Skeleton key={i} className="h-14 w-full"/>))}
        </div>) : transactions.length === 0 ? (<div className="text-center py-8">
          <p className="text-muted-foreground">
            No transactions yet. Send your first transfer to get started!
          </p>
        </div>) : (<ul className="divide-y divide-border">
          {transactions.slice(0, 5).map((transaction) => (<li key={transaction.id} className="flex items-center gap-4 py-3">
              <DirectionIcon transaction={transaction}/>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {transaction.type === 'SEND' ? 'To ' : 'From '}
                  {counterpartyLabel(transaction)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {transaction.note || formatAccountNumber(transaction.counterparty?.accountNumber)}
                  {' · '}
                  {formatDateTime(transaction.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className={`font-semibold tabular-nums ${signedAmountClass(transaction)}`}>
                  {transaction.type === 'SEND' ? '−' : '+'}
                  {formatCents(transaction.amountCents)}
                </p>
                {transaction.status !== 'SUCCESS' && <StatusBadge status={transaction.status}/>}
              </div>
            </li>))}
        </ul>)}
    </Card>);
}
