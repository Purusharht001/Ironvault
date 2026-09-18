'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FORMATS } from '@/lib/constants';
import { toast } from 'sonner';

interface BalanceCardProps {
  balanceCents: number;
  accountNumber: string;
  isLoading?: boolean;
}

export function BalanceCard({
  balanceCents,
  accountNumber,
  isLoading = false,
}: BalanceCardProps) {
  const balanceDollars = (balanceCents / FORMATS.CENT_DIVISOR).toFixed(
    FORMATS.DECIMAL_PLACES
  );

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      toast.success('Account number copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy account number');
    }
  };

  return (
    <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
          <p className="text-5xl font-bold text-foreground">
            {FORMATS.CURRENCY_SYMBOL}
            {balanceDollars}
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Account Number</p>
          <div className="flex items-center gap-2">
            <code className="font-mono text-lg font-semibold bg-background px-4 py-2 rounded flex-1">
              {accountNumber}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAccountNumber}
              disabled={isLoading}
            >
              Copy
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          All amounts displayed in USD. Backend stores in cents for precision.
        </p>
      </div>
    </Card>
  );
}
