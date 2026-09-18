'use client';

import { Card } from '@/components/ui/card';
import { FORMATS } from '@/lib/constants';

interface StatsSectionProps {
  totalSentCents: number;
  totalReceivedCents: number;
  transferCount: number;
  isLoading?: boolean;
}

export function StatsSection({
  totalSentCents,
  totalReceivedCents,
  transferCount,
  isLoading = false,
}: StatsSectionProps) {
  const totalSent = (totalSentCents / FORMATS.CENT_DIVISOR).toFixed(
    FORMATS.DECIMAL_PLACES
  );
  const totalReceived = (totalReceivedCents / FORMATS.CENT_DIVISOR).toFixed(
    FORMATS.DECIMAL_PLACES
  );

  const stats = [
    {
      label: 'Sent This Month',
      value: `${FORMATS.CURRENCY_SYMBOL}${totalSent}`,
      icon: '📤',
      color: 'from-orange-50 to-orange-100/50',
    },
    {
      label: 'Received This Month',
      value: `${FORMATS.CURRENCY_SYMBOL}${totalReceived}`,
      icon: '📥',
      color: 'from-green-50 to-green-100/50',
    },
    {
      label: 'Successful Transfers',
      value: transferCount.toString(),
      icon: '✅',
      color: 'from-blue-50 to-blue-100/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className={`p-6 bg-gradient-to-br ${stat.color} border-border/50`}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stat.value}
              </p>
            </div>
            <span className="text-3xl">{stat.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
