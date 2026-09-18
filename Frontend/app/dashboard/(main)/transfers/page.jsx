'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { TransferForm } from '@/components/dashboard/TransferForm';
import { Card } from '@/components/ui/card';
export default function TransfersPage() {
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
    if (isLoading || !account) {
        return (<div className="flex items-center justify-center min-h-96">
        <p className="text-muted-foreground">Loading...</p>
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
      <Card className="p-8 max-w-2xl">
        <TransferForm accountNumber={account.accountNumber} balanceCents={account.balanceCents}/>
      </Card>

      {/* Info Section */}
      <Card className="p-6 bg-blue-50/50 border-blue-200/50">
        <h3 className="font-semibold text-foreground mb-3">
          About Secure Transfers
        </h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            ✓ <strong>Idempotency:</strong> Your reference ID ensures transfers are
            processed exactly once, preventing duplicates even if requests retry
          </li>
          <li>
            ✓ <strong>ACID Compliance:</strong> All transactions are atomic,
            consistent, isolated, and durable
          </li>
          <li>
            ✓ <strong>Immutable History:</strong> Once processed, transactions
            cannot be modified or reversed
          </li>
          <li>
            ✓ <strong>Real-time Updates:</strong> Balance and transaction status
            reflect actual bank state
          </li>
        </ul>
      </Card>
    </div>);
}
