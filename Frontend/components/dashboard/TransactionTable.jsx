'use client';
import { FORMATS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
export function TransactionTable({ transactions, isLoading = false, currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, total, }) {
    const getStatusBadge = (status) => {
        const styles = {
            SUCCESS: 'bg-green-100 text-green-800',
            PENDING: 'bg-yellow-100 text-yellow-800',
            FAILED: 'bg-red-100 text-red-800',
        };
        return styles[status] || styles.PENDING;
    };
    const getTypeIcon = (type) => {
        return type === 'SEND' ? '📤' : '📥';
    };
    const formatAmount = (cents) => {
        const dollars = (cents / FORMATS.CENT_DIVISOR).toFixed(FORMATS.DECIMAL_PLACES);
        return `${FORMATS.CURRENCY_SYMBOL}${dollars}`;
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const handleCopyReferenceId = async (referenceId) => {
        try {
            await navigator.clipboard.writeText(referenceId);
            toast.success('Reference ID copied');
        }
        catch (error) {
            toast.error('Failed to copy');
        }
    };
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, total);
    if (transactions.length === 0 && !isLoading) {
        return (<div className="text-center py-8 text-muted-foreground">
        No transactions found.
      </div>);
    }
    return (<div className="space-y-6">
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Type
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Reference ID
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Sender
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Receiver
              </th>
              <th className="text-right py-4 px-4 font-semibold text-foreground">
                Amount
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Status
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (<tr key={transaction.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-4 px-4">
                  <span className="text-lg">
                    {getTypeIcon(transaction.type)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <code className="bg-muted px-2 py-1 rounded font-mono text-xs cursor-pointer hover:bg-muted/80" onClick={() => handleCopyReferenceId(transaction.referenceId)} title="Click to copy">
                    {transaction.referenceId.substring(0, 20)}...
                  </code>
                </td>
                <td className="py-4 px-4 font-mono text-xs">
                  {transaction.senderAccountNumber}
                </td>
                <td className="py-4 px-4 font-mono text-xs">
                  {transaction.receiverAccountNumber}
                </td>
                <td className="py-4 px-4 text-right font-semibold">
                  <span className={transaction.type === 'SEND'
                ? 'text-red-600'
                : 'text-green-600'}>
                    {transaction.type === 'SEND' ? '-' : '+'}
                    {formatAmount(transaction.amountCents)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-muted-foreground text-xs">
                  {formatDate(transaction.createdAt)}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex}-{endIndex} of {total}
          </span>
          <select value={pageSize} onChange={(e) => onPageSizeChange(parseInt(e.target.value))} className="px-3 py-2 border border-border rounded text-sm">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
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
    </div>);
}
