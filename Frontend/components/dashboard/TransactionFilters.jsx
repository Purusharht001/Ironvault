'use client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function TransactionFilters({ searchQuery, onSearchChange, statusFilter, onStatusChange, rangeFilter, onRangeChange, }) {
    return (<div className="space-y-4">
      {/* Search Input */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-2">
          Search by Reference ID or Account Number
        </label>
        <Input id="search" type="text" placeholder="Search transactions..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}/>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select id="status" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <div className="flex gap-2">
            {['week', 'month', 'all'].map((range) => (<Button key={range} variant={rangeFilter === range ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange(range)} className="flex-1">
                {range === 'week'
                ? 'Last 7 Days'
                : range === 'month'
                    ? 'Last 30 Days'
                    : 'All Time'}
              </Button>))}
          </div>
        </div>
      </div>
    </div>);
}
