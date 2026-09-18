'use client';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCents } from '@/lib/utils';
// Validated for light surfaces (CVD + contrast); identity is also carried by the legend and tooltip labels.
const SERIES = [
    { key: 'receivedCents', label: 'Money in', color: '#0073e6' },
    { key: 'sentCents', label: 'Money out', color: '#c85a0a' },
];
const chartConfig = Object.fromEntries(SERIES.map((s) => [s.key, { label: s.label, color: s.color }]));
const formatDay = (isoDate) => new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const compactDollars = (cents) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
}).format(cents / 100);
function ActivityTooltip({ active, payload, label }) {
    if (!active || !payload?.length)
        return null;
    return (<div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-foreground">{formatDay(label)}</p>
      {SERIES.map((series) => {
            const item = payload.find((p) => p.dataKey === series.key);
            return (<div key={series.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: series.color }}/>
              {series.label}
            </span>
            <span className="font-mono tabular-nums text-foreground">{formatCents(item?.value ?? 0)}</span>
          </div>);
        })}
    </div>);
}
export function ActivityChart({ series, isLoading = false }) {
    const totals = SERIES.map((s) => ({
        ...s,
        total: (series || []).reduce((sum, day) => sum + day[s.key], 0),
    }));
    const hasActivity = totals.some((t) => t.total > 0);
    return (<Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Cash Flow</h2>
          <p className="text-sm text-muted-foreground">Daily money in and out, last 30 days</p>
        </div>
        {/* Legend doubles as a summary: identity is never color alone */}
        <div className="flex gap-6" role="list" aria-label="Legend">
          {totals.map((t) => (<div key={t.key} role="listitem">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: t.color }}/>
                {t.label}
              </div>
              <p className="text-lg font-semibold text-foreground tabular-nums">{formatCents(t.total)}</p>
            </div>))}
        </div>
      </div>

      {isLoading ? (<Skeleton className="h-64 w-full"/>) : !hasActivity ? (<div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          No money has moved in the last 30 days.
        </div>) : (<ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.5}/>
            <XAxis dataKey="date" tickFormatter={formatDay} tickLine={false} axisLine={false} minTickGap={32} tickMargin={8}/>
            <YAxis tickFormatter={compactDollars} tickLine={false} axisLine={false} width={56} allowDecimals={false}/>
            <Tooltip content={<ActivityTooltip />} cursor={{ strokeDasharray: '3 3' }}/>
            {SERIES.map((s) => (<Line key={s.key} dataKey={s.key} name={s.label} type="monotone" stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))' }} isAnimationActive={false}/>))}
          </LineChart>
        </ChartContainer>)}
    </Card>);
}
