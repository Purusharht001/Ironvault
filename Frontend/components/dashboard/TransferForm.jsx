'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { VALIDATION } from '@/lib/constants';
import { formatAccountNumber, formatCents, generateIdempotencyKey, parseDollarsToCents } from '@/lib/utils';
const emptyForm = () => ({
    toAccountNumber: '',
    amountDollars: '',
    note: '',
    referenceId: generateIdempotencyKey(),
});
export function TransferForm({ accountNumber, balanceCents, onTransferComplete, }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryHint, setRetryHint] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [formData, setFormData] = useState({ toAccountNumber: '', amountDollars: '', note: '', referenceId: '' });
    const [recipient, setRecipient] = useState({ status: 'idle', name: null });
    // Generate the key on the client only (avoids a server/client hydration mismatch)
    useEffect(() => {
        setFormData(emptyForm());
    }, []);
    // Look up the recipient's name once a full account number has been entered
    useEffect(() => {
        const number = formData.toAccountNumber;
        if (number.length !== VALIDATION.ACCOUNT_NUMBER_LENGTH) {
            setRecipient({ status: 'idle', name: null });
            return;
        }
        if (number === accountNumber) {
            setRecipient({ status: 'self', name: null });
            return;
        }
        let cancelled = false;
        setRecipient({ status: 'loading', name: null });
        api.account.lookup(number)
            .then((res) => !cancelled && setRecipient({ status: 'found', name: res.name }))
            .catch((err) => !cancelled && setRecipient({ status: err.status === 404 ? 'notfound' : 'idle', name: null }));
        return () => {
            cancelled = true;
        };
    }, [formData.toAccountNumber, accountNumber]);
    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;
        if (name === 'toAccountNumber')
            value = value.replace(/\D/g, '').slice(0, VALIDATION.ACCOUNT_NUMBER_LENGTH);
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError(null);
        setRetryHint(false);
    };
    const regenerateReferenceId = () => {
        setFormData((prev) => ({
            ...prev,
            referenceId: generateIdempotencyKey(),
        }));
        setRetryHint(false);
    };
    const amountCents = parseDollarsToCents(formData.amountDollars);
    const validateForm = () => {
        if (!formData.toAccountNumber) {
            return 'Recipient account number is required';
        }
        if (formData.toAccountNumber.length !== VALIDATION.ACCOUNT_NUMBER_LENGTH) {
            return `Account number must be ${VALIDATION.ACCOUNT_NUMBER_LENGTH} digits`;
        }
        if (formData.toAccountNumber === accountNumber) {
            return 'Cannot transfer to your own account';
        }
        if (recipient.status === 'notfound') {
            return 'No active account with that number';
        }
        if (!formData.amountDollars) {
            return 'Transfer amount is required';
        }
        if (amountCents === null) {
            return 'Enter a valid amount with at most 2 decimal places';
        }
        if (amountCents < VALIDATION.MIN_TRANSFER_AMOUNT_CENTS) {
            return 'Transfer amount must be at least $0.01';
        }
        if (amountCents > VALIDATION.MAX_TRANSFER_AMOUNT_CENTS) {
            return 'Transfer amount exceeds maximum limit';
        }
        if (amountCents > balanceCents) {
            return 'Insufficient funds for this transfer';
        }
        if (formData.note.length > VALIDATION.MAX_NOTE_LENGTH) {
            return `Note must be at most ${VALIDATION.MAX_NOTE_LENGTH} characters`;
        }
        if (formData.referenceId.trim().length < 8) {
            return 'Reference ID (idempotency key) must be at least 8 characters';
        }
        return null;
    };
    const handleReview = (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }
        setConfirmOpen(true);
    };
    const handleSubmit = async () => {
        setConfirmOpen(false);
        setIsLoading(true);
        setError(null);
        setRetryHint(false);
        try {
            const result = await api.transaction.createTransfer({
                toAccountNumber: formData.toAccountNumber,
                amountCents,
                referenceId: formData.referenceId.trim(),
                note: formData.note.trim() || undefined,
            });
            toast.success(`Sent ${formatCents(result.amountCents)} to ${result.counterparty?.name || formatAccountNumber(result.receiverAccountNumber)}`);
            setReceipt(result);
            setFormData(emptyForm());
            onTransferComplete?.(result);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send transfer';
            setError(errorMessage);
            toast.error(errorMessage);
            // The server may or may not have processed it: keep the same key so a retry
            // is deduplicated instead of charging twice.
            if (err.isNetworkError || err.status >= 500) {
                setRetryHint(true);
            }
            else {
                // A definitive answer consumed (or rejected) this key; use a fresh one next time.
                regenerateReferenceId();
                if (err.data?.transaction)
                    onTransferComplete?.(err.data.transaction);
            }
        }
        finally {
            setIsLoading(false);
        }
    };
    if (receipt) {
        return (<div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" aria-hidden="true"/>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transfer complete</h2>
          <p className="text-muted-foreground mt-1">
            {formatCents(receipt.amountCents)} sent to{' '}
            <strong>{receipt.counterparty?.name || formatAccountNumber(receipt.receiverAccountNumber)}</strong>
          </p>
        </div>
        <Card className="p-4 text-left text-sm space-y-2 bg-muted/30">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Reference ID</span>
            <code className="font-mono text-xs break-all">{receipt.referenceId}</code>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Recipient account</span>
            <code className="font-mono text-xs">{formatAccountNumber(receipt.receiverAccountNumber)}</code>
          </div>
          {typeof receipt.balanceAfterCents === 'number' && (<div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Balance after transfer</span>
              <span className="font-semibold tabular-nums">{formatCents(receipt.balanceAfterCents)}</span>
            </div>)}
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => setReceipt(null)}>Send another transfer</Button>
          <Link href="/dashboard/transactions">
            <Button variant="outline" className="w-full">View transaction history</Button>
          </Link>
        </div>
      </div>);
    }
    const recipientName = recipient.name || formatAccountNumber(formData.toAccountNumber);
    return (<form onSubmit={handleReview} className="space-y-6" noValidate>
      {/* From Account Section */}
      <Card className="p-6 bg-muted/30 border-border/50">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">
          From Your Account
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Number</p>
            <code className="block bg-background px-4 py-3 rounded font-mono text-sm font-semibold">
              {formatAccountNumber(accountNumber)}
            </code>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {formatCents(balanceCents)}
            </p>
          </div>
        </div>
      </Card>

      {/* To Account Section */}
      <div>
        <label htmlFor="toAccountNumber" className="block text-sm font-semibold mb-2">
          Recipient Account Number
        </label>
        <Input id="toAccountNumber" name="toAccountNumber" type="text" inputMode="numeric" autoComplete="off" placeholder="Enter 12-digit account number" value={formData.toAccountNumber} onChange={handleChange} disabled={isLoading} className="font-mono tracking-wider"/>
        <div className="mt-1.5 min-h-5 text-xs" aria-live="polite">
          {recipient.status === 'idle' && (<span className="text-muted-foreground">
              {formData.toAccountNumber.length}/{VALIDATION.ACCOUNT_NUMBER_LENGTH} digits
            </span>)}
          {recipient.status === 'loading' && (<span className="inline-flex items-center gap-1 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true"/> Looking up account…
            </span>)}
          {recipient.status === 'found' && (<span className="inline-flex items-center gap-1 text-green-700 font-medium">
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true"/> {recipient.name}
            </span>)}
          {recipient.status === 'notfound' && (<span className="inline-flex items-center gap-1 text-destructive">
              <UserX className="h-3.5 w-3.5" aria-hidden="true"/> No active account with that number
            </span>)}
          {recipient.status === 'self' && (<span className="inline-flex items-center gap-1 text-destructive">
              <UserX className="h-3.5 w-3.5" aria-hidden="true"/> That is your own account
            </span>)}
        </div>
      </div>

      {/* Amount Section */}
      <div>
        <label htmlFor="amountDollars" className="block text-sm font-semibold mb-2">
          Amount (USD)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input id="amountDollars" name="amountDollars" type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={formData.amountDollars} onChange={handleChange} disabled={isLoading} className="pl-7 tabular-nums"/>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Converted to whole cents before it leaves your browser
          {amountCents !== null && amountCents > 0 && (<> — <span className="font-mono">{amountCents.toLocaleString()} cents</span></>)}
        </p>
      </div>

      {/* Note Section */}
      <div>
        <label htmlFor="note" className="block text-sm font-semibold mb-2">
          Note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input id="note" name="note" type="text" placeholder="e.g. Rent for September" maxLength={VALIDATION.MAX_NOTE_LENGTH} value={formData.note} onChange={handleChange} disabled={isLoading}/>
      </div>

      {/* Reference ID Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="referenceId" className="block text-sm font-semibold">
            Reference ID (Idempotency Key)
          </label>
          <Button type="button" variant="outline" size="sm" onClick={regenerateReferenceId} disabled={isLoading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true"/>
            Regenerate
          </Button>
        </div>
        <Input id="referenceId" name="referenceId" type="text" placeholder="e.g., transfer-001-abc123" value={formData.referenceId} onChange={handleChange} disabled={isLoading} className="font-mono text-xs"/>
        <p className="text-xs text-muted-foreground mt-1">
          Generated automatically. Submitting the same ID twice is processed only once.
        </p>
      </div>

      {/* Error Message */}
      {error && (<div className="bg-destructive/10 border border-destructive/20 rounded p-4" role="alert">
          <p className="text-sm text-destructive">{error}</p>
          {retryHint && (<p className="text-xs text-muted-foreground mt-2">
              It is safe to press Send again: the same reference ID is kept, so the server will
              never process this transfer twice.
            </p>)}
        </div>)}

      {/* Submit Button */}
      <Button type="submit" className="w-full bg-primary hover:bg-primary/90" size="lg" disabled={isLoading || recipient.status === 'loading'}>
        {isLoading ? (<>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true"/>
            Processing Transfer...
          </>) : (<>
            <ShieldCheck className="h-4 w-4 mr-2" aria-hidden="true"/>
            {retryHint ? 'Retry Transfer Safely' : 'Review Transfer'}
          </>)}
      </Button>

      <p className="text-xs text-muted-foreground text-center italic">
        Simulated money only. Completed transfers are immutable and cannot be reversed.
      </p>

      {/* Confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Send <strong className="text-foreground">{amountCents !== null ? formatCents(amountCents) : ''}</strong> to{' '}
              <strong className="text-foreground">{recipientName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="rounded-md bg-muted/40 p-3 text-sm space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">To account</dt>
              <dd className="font-mono text-xs">{formatAccountNumber(formData.toAccountNumber)}</dd>
            </div>
            {formData.note.trim() && (<div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Note</dt>
                <dd className="text-right">{formData.note.trim()}</dd>
              </div>)}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Balance after</dt>
              <dd className="tabular-nums">{amountCents !== null ? formatCents(balanceCents - amountCents) : ''}</dd>
            </div>
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Send {amountCents !== null ? formatCents(amountCents) : ''}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>);
}
