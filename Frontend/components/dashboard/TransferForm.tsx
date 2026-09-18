'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { FORMATS, VALIDATION } from '@/lib/constants';
import { generateIdempotencyKey } from '@/lib/utils';

interface TransferFormProps {
  accountNumber: string;
  balanceCents: number;
}

export function TransferForm({
  accountNumber,
  balanceCents,
}: TransferFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    toAccountNumber: '',
    amountDollars: '',
    referenceId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const generateRandomReferenceId = () => {
    const newId = generateIdempotencyKey();
    setFormData((prev) => ({
      ...prev,
      referenceId: newId,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.toAccountNumber.trim()) {
      setError('Recipient account number is required');
      return false;
    }
    if (formData.toAccountNumber.length !== VALIDATION.ACCOUNT_NUMBER_LENGTH) {
      setError(
        `Account number must be ${VALIDATION.ACCOUNT_NUMBER_LENGTH} digits`
      );
      return false;
    }
    if (!/^\d+$/.test(formData.toAccountNumber)) {
      setError('Account number must contain only digits');
      return false;
    }
    if (formData.toAccountNumber === accountNumber) {
      setError('Cannot transfer to your own account');
      return false;
    }
    if (!formData.amountDollars) {
      setError('Transfer amount is required');
      return false;
    }

    const amountCents = Math.round(
      parseFloat(formData.amountDollars) * FORMATS.CENT_DIVISOR
    );
    if (isNaN(amountCents) || amountCents <= 0) {
      setError('Transfer amount must be positive');
      return false;
    }
    if (amountCents > VALIDATION.MAX_TRANSFER_AMOUNT_CENTS) {
      setError('Transfer amount exceeds maximum limit');
      return false;
    }
    if (amountCents > balanceCents) {
      setError('Insufficient funds for this transfer');
      return false;
    }
    if (!formData.referenceId.trim()) {
      setError('Reference ID (idempotency key) is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const amountCents = Math.round(
        parseFloat(formData.amountDollars) * FORMATS.CENT_DIVISOR
      );

      await api.transaction.createTransfer({
        toAccountNumber: formData.toAccountNumber,
        amountCents,
        referenceId: formData.referenceId,
      });

      toast.success('Transfer sent successfully');
      setFormData({
        toAccountNumber: '',
        amountDollars: '',
        referenceId: '',
      });
      router.push('/dashboard');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send transfer';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const balanceDollars = (balanceCents / FORMATS.CENT_DIVISOR).toFixed(
    FORMATS.DECIMAL_PLACES
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* From Account Section */}
      <Card className="p-6 bg-muted/30 border-border/50">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">
          From Your Account
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Number</p>
            <code className="block bg-background px-4 py-3 rounded font-mono text-sm font-semibold">
              {accountNumber}
            </code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-foreground">
              {FORMATS.CURRENCY_SYMBOL}
              {balanceDollars}
            </p>
          </div>
        </div>
      </Card>

      {/* To Account Section */}
      <div>
        <label htmlFor="toAccountNumber" className="block text-sm font-semibold mb-2">
          Recipient Account Number
        </label>
        <Input
          id="toAccountNumber"
          name="toAccountNumber"
          type="text"
          placeholder="Enter 12-digit account number"
          value={formData.toAccountNumber}
          onChange={handleChange}
          disabled={isLoading}
          maxLength={VALIDATION.ACCOUNT_NUMBER_LENGTH}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Must be exactly {VALIDATION.ACCOUNT_NUMBER_LENGTH} digits
        </p>
      </div>

      {/* Amount Section */}
      <div>
        <label htmlFor="amountDollars" className="block text-sm font-semibold mb-2">
          Amount (USD)
        </label>
        <Input
          id="amountDollars"
          name="amountDollars"
          type="number"
          placeholder="0.00"
          step="0.01"
          min="0"
          value={formData.amountDollars}
          onChange={handleChange}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Amount is stored in cents for precision. Minimum: ${VALIDATION.MIN_TRANSFER_AMOUNT_CENTS / FORMATS.CENT_DIVISOR}
        </p>
      </div>

      {/* Reference ID Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="referenceId" className="block text-sm font-semibold">
            Reference ID (Idempotency Key)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateRandomReferenceId}
            disabled={isLoading}
          >
            Generate Random
          </Button>
        </div>
        <Input
          id="referenceId"
          name="referenceId"
          type="text"
          placeholder="e.g., transfer-001-abc123"
          value={formData.referenceId}
          onChange={handleChange}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Unique identifier for this transfer. Prevents duplicate processing if request retried.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Processing Transfer...
          </>
        ) : (
          'Send Money Securely'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center italic">
        ⚠️ This action will transfer real money in a real bank (simulator context).
        All transactions are immutable and cannot be reversed.
      </p>
    </form>
  );
}
