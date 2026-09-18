'use client';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Landmark, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
const STATUS_STYLES = {
    SUCCESS: { className: 'bg-green-100 text-green-800', Icon: CheckCircle2, label: 'Success' },
    PENDING: { className: 'bg-yellow-100 text-yellow-800', Icon: Clock, label: 'Pending' },
    FAILED: { className: 'bg-red-100 text-red-800', Icon: XCircle, label: 'Failed' },
};
// Status always carries an icon + label, never color alone
export function StatusBadge({ status }) {
    const { className, Icon, label } = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
    return (<span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true"/>
      {label}
    </span>);
}
export function DirectionIcon({ transaction }) {
    if (transaction.kind === 'OPENING_DEPOSIT') {
        return (<span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary" title="Opening deposit">
        <Landmark className="h-4 w-4" aria-hidden="true"/>
      </span>);
    }
    const isSend = transaction.type === 'SEND';
    const Icon = isSend ? ArrowUpRight : ArrowDownLeft;
    return (<span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-full', isSend ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700')} title={isSend ? 'Sent' : 'Received'}>
      <Icon className="h-4 w-4" aria-hidden="true"/>
      <span className="sr-only">{isSend ? 'Sent' : 'Received'}</span>
    </span>);
}
// "Alice" or the raw account number if the name is unknown
export function counterpartyLabel(transaction) {
    return transaction.counterparty?.name || transaction.counterparty?.accountNumber || '—';
}
export function signedAmountClass(transaction) {
    if (transaction.status !== 'SUCCESS')
        return 'text-muted-foreground line-through';
    return transaction.type === 'SEND' ? 'text-foreground' : 'text-green-700';
}
