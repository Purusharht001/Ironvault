'use client';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
const selectClass = 'w-full h-10 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm';
export function TransactionFilters({ searchQuery, onSearchChange, statusFilter, onStatusChange, typeFilter, onTypeChange, rangeFilter, onRangeChange, }) {
    return (<div className="space-y-4">
      {/* Search Input */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-2">
          Search by Reference ID, Account Number or Note
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true"/>
          <Input id="search" type="search" placeholder="Search transactions..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9"/>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-2">
            Status
          </label>
          <select id="status" value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {/* Direction Filter */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-2">
            Direction
          </label>
          <select id="type" value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
            <option value="">Sent &amp; Received</option>
            <option value="SEND">Sent</option>
            <option value="RECEIVE">Received</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <span className="block text-sm font-medium mb-2">Date Range</span>
          <div className="flex gap-2" role="group" aria-label="Date range">
            {['week', 'month', 'all'].map((range) => (<Button key={range} type="button" variant={rangeFilter === range ? 'default' : 'outline'} size="sm" onClick={() => onRangeChange(range)} className="flex-1 h-10" aria-pressed={rangeFilter === range}>
                {range === 'week'
                ? '7 Days'
                : range === 'month'
                    ? '30 Days'
                    : 'All Time'}
              </Button>))}
          </div>
        </div>
      </div>
    </div>);
}
