'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UI } from '@/lib/constants';
import { formatAccountNumber, formatCents, formatDateTime } from '@/lib/utils';
import { counterpartyLabel, DirectionIcon, signedAmountClass, StatusBadge } from './TransactionBits';
import { TransactionDetailDialog } from './TransactionDetailDialog';
export function TransactionTable({ transactions, isLoading = false, currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, total, }) {
    const [selected, setSelected] = useState(null);
    const startIndex = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, total);
    if (isLoading && transactions.length === 0) {
        return (<div className="space-y-3">
        {Array.from({ length: UI.LOADING_SKELETON_ITEMS }, (_, i) => (<Skeleton key={i} className="h-14 w-full"/>))}
      </div>);
    }
    if (transactions.length === 0) {
        return (<div className="text-center py-8 text-muted-foreground">
        No transactions found.
      </div>);
    }
    return (<div className="space-y-6">
      <div className={`overflow-x-auto border border-border rounded-lg transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th scope="col" className="text-left py-3 px-4 font-semibold text-foreground">
                Counterparty
              </th>
              <th scope="col" className="text-left py-3 px-4 font-semibold text-foreground hidden lg:table-cell">
                Reference ID
              </th>
              <th scope="col" className="text-left py-3 px-4 font-semibold text-foreground hidden md:table-cell">
                Status
              </th>
              <th scope="col" className="text-left py-3 px-4 font-semibold text-foreground hidden sm:table-cell">
                Date
              </th>
              <th scope="col" className="text-right py-3 px-4 font-semibold text-foreground">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (<tr key={transaction.id} onClick={() => setSelected(transaction)} onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(transaction);
                }
            }} tabIndex={0} className="border-b border-border/50 last:border-0 hover:bg-muted/30 focus-visible:bg-muted/40 focus-visible:outline-none cursor-pointer transition-colors" aria-label={`View details for transaction ${transaction.referenceId}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <DirectionIcon transaction={transaction}/>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{counterpartyLabel(transaction)}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {formatAccountNumber(transaction.counterparty?.accountNumber)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs" title={transaction.referenceId}>
                    {transaction.referenceId.length > 24
                ? `${transaction.referenceId.substring(0, 24)}…`
                : transaction.referenceId}
                  </code>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <StatusBadge status={transaction.status}/>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell whitespace-nowrap">
                  {formatDateTime(transaction.createdAt)}
                </td>
                <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">
                  <span className={`tabular-nums ${signedAmountClass(transaction)}`}>
                    {transaction.type === 'SEND' ? '−' : '+'}
                    {formatCents(transaction.amountCents)}
                  </span>
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex}–{endIndex} of {total}
          </span>
          <label htmlFor="pageSize" className="sr-only">Rows per page</label>
          <select id="pageSize" value={pageSize} onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))} className="px-3 py-2 border border-border rounded bg-background text-sm">
            {UI.PAGE_SIZE_OPTIONS.map((size) => (<option key={size} value={size}>{size} / page</option>))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>
            Next
          </Button>
        </div>
      </div>

      <TransactionDetailDialog transaction={selected} onOpenChange={(open) => !open && setSelected(null)}/>
    </div>);
}
