'use client';
import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents } from '@/lib/utils';
export function StatsSection({ totalSentCents, totalReceivedCents, transferCount, isLoading = false, }) {
    const stats = [
        {
            label: 'Sent This Month',
            value: formatCents(totalSentCents),
            Icon: ArrowUpRight,
            iconClass: 'bg-orange-100 text-orange-700',
        },
        {
            label: 'Received This Month',
            value: formatCents(totalReceivedCents),
            Icon: ArrowDownLeft,
            iconClass: 'bg-green-100 text-green-700',
        },
        {
            label: 'Transfers This Month',
            value: String(transferCount ?? 0),
            Icon: Repeat,
            iconClass: 'bg-blue-100 text-blue-700',
        },
    ];
    return (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map(({ label, value, Icon, iconClass }) => (<Card key={label} className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{label}</p>
              {isLoading ? (<Skeleton className="h-9 w-32"/>) : (<p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>)}
            </div>
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${iconClass}`}>
              <Icon className="h-5 w-5" aria-hidden="true"/>
            </span>
          </div>
        </Card>))}
    </div>);
}
