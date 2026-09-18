'use client';
import { useCallback, useEffect, useState } from 'react';
import { Snowflake } from 'lucide-react';
import { api } from '@/lib/api';
import { TransferForm } from '@/components/dashboard/TransferForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
export default function TransfersPage() {
    const [account, setAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchAccount = useCallback(async () => {
        try {
            setError(null);
            const accountData = await api.account.getAccount();
            setAccount(accountData);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load account');
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>);
    }
    if (!account) {
        return (<div className="flex flex-col items-center justify-center min-h-96 gap-4 text-center">
        <p className="text-muted-foreground">{error || 'Account not available'}</p>
        <Button onClick={() => { setIsLoading(true); fetchAccount(); }}>Try Again</Button>
      </div>);
    }
    return (<div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Send Money</h1>
        <p className="text-muted-foreground mt-2">
          Transfer funds securely to another account with ACID-guaranteed consistency
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6 sm:p-8 max-w-2xl">
        {account.status === 'FROZEN' ? (<div className="flex items-start gap-3" role="alert">
            <Snowflake className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true"/>
            <div>
              <h2 className="font-semibold text-foreground">Your account is frozen</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Account is frozen. Transactions are disabled. Please contact IronVault support
                to have it reviewed. Your balance and history remain available.
              </p>
            </div>
          </div>) : (
        // Refresh the balance after every attempt so it always reflects the server
        <TransferForm accountNumber={account.accountNumber} balanceCents={account.balanceCents} onTransferComplete={fetchAccount}/>)}
      </Card>

      {/* Info Section */}
      <Card className="p-6 bg-blue-50/50 border-blue-200/50 max-w-2xl">
        <h3 className="font-semibold text-foreground mb-3">
          About Secure Transfers
        </h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            ✓ <strong>Idempotency:</strong> Your reference ID ensures transfers are
            processed exactly once, preventing duplicates even if requests retry
          </li>
          <li>
            ✓ <strong>ACID Compliance:</strong> The debit, the credit and the ledger
            entry are committed together in one database transaction, or not at all
          </li>
          <li>
            ✓ <strong>Integer Cents:</strong> Amounts travel and are stored as whole
            cents, so there are no floating-point rounding errors
          </li>
          <li>
            ✓ <strong>Immutable History:</strong> Once processed, transactions
            cannot be modified or reversed
          </li>
        </ul>
      </Card>
    </div>);
}
