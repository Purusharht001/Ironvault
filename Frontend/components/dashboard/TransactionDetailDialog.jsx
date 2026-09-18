'use client';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { formatAccountNumber, formatCents, formatDateTime } from '@/lib/utils';
import { counterpartyLabel, DirectionIcon, StatusBadge } from './TransactionBits';
function Row({ label, children }) {
    return (<div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/60 last:border-0">
      <dt className="text-sm text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm text-foreground text-right break-all">{children}</dd>
    </div>);
}
export function TransactionDetailDialog({ transaction, onOpenChange }) {
    const copy = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        }
        catch {
            toast.error('Failed to copy');
        }
    };
    return (<Dialog open={Boolean(transaction)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {transaction && (<>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DirectionIcon transaction={transaction}/>
                <div className="text-left">
                  <DialogTitle>
                    {transaction.type === 'SEND' ? 'Sent to ' : 'Received from '}
                    {counterpartyLabel(transaction)}
                  </DialogTitle>
                  <DialogDescription>{formatDateTime(transaction.createdAt)}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="text-center py-2">
              <p className="text-4xl font-bold tabular-nums text-foreground">
                {transaction.type === 'SEND' ? '−' : '+'}
                {formatCents(transaction.amountCents)}
              </p>
              <div className="mt-2">
                <StatusBadge status={transaction.status}/>
              </div>
              {transaction.failureReason && (<p className="mt-2 text-sm text-destructive">{transaction.failureReason}</p>)}
            </div>

            <dl>
              {transaction.note && <Row label="Note">{transaction.note}</Row>}
              <Row label="Reference ID">
                <button type="button" onClick={() => copy(transaction.referenceId, 'Reference ID')} className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-primary" title="Copy reference ID">
                  {transaction.referenceId}
                  <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true"/>
                </button>
              </Row>
              <Row label="From">
                <span className="font-mono text-xs">{formatAccountNumber(transaction.senderAccountNumber)}</span>
              </Row>
              <Row label="To">
                <span className="font-mono text-xs">{formatAccountNumber(transaction.receiverAccountNumber)}</span>
              </Row>
              <Row label="Type">{transaction.kind === 'OPENING_DEPOSIT' ? 'Opening deposit' : 'Transfer'}</Row>
              <Row label="Ledger ID">
                <span className="font-mono text-xs">{transaction.id}</span>
              </Row>
            </dl>

            <p className="text-xs text-muted-foreground italic">
              Ledger entries are immutable and cannot be edited or reversed.
            </p>
          </>)}
      </DialogContent>
    </Dialog>);
}
