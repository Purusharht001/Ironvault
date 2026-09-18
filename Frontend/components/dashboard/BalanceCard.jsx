'use client';
import { Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAccountNumber, formatCents } from '@/lib/utils';
import { toast } from 'sonner';
export function BalanceCard({ balanceCents, accountNumber, isLoading = false, }) {
    const handleCopyAccountNumber = async () => {
        try {
            await navigator.clipboard.writeText(accountNumber);
            toast.success('Account number copied to clipboard');
        }
        catch (error) {
            toast.error('Failed to copy account number');
        }
    };
    return (<Card className="p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
          {isLoading ? (<Skeleton className="h-12 w-56"/>) : (<p className="text-4xl sm:text-5xl font-bold text-foreground tabular-nums">
              {formatCents(balanceCents)}
            </p>)}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Account Number</p>
          <div className="flex items-center gap-2">
            <code className="font-mono text-base sm:text-lg font-semibold bg-background px-4 py-2 rounded flex-1 tracking-wide">
              {isLoading ? '•••• •••• ••••' : formatAccountNumber(accountNumber)}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopyAccountNumber} disabled={isLoading}>
              <Copy className="h-4 w-4 mr-1" aria-hidden="true"/>
              Copy
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          All amounts displayed in USD. Backend stores in cents for precision.
        </p>
      </div>
    </Card>);
}
