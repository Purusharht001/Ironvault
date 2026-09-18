'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { TransactionFilters } from '@/components/dashboard/TransactionFilters';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { Card } from '@/components/ui/card';
import type { Transaction } from '@/lib/types';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState<'week' | 'month' | 'all'>(
    'all'
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.transaction.list({
          page: currentPage,
          limit: pageSize,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
          rangeType: rangeFilter,
        });

        setTransactions(response.transactions);
        setTotal(response.total);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load transactions';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, pageSize, statusFilter, searchQuery, rangeFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Transaction History
        </h1>
        <p className="text-muted-foreground mt-2">
          View your complete, immutable transaction ledger with ACID guarantees
        </p>
      </div>

      {/* Filters Card */}
      <Card className="p-6">
        <TransactionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          rangeFilter={rangeFilter}
          onRangeChange={setRangeFilter}
        />
      </Card>

      {/* Transactions Table */}
      {error ? (
        <Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      ) : (
        <Card className="p-6">
          <TransactionTable
            transactions={transactions}
            isLoading={isLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            total={total}
          />
        </Card>
      )}

      {/* Info Section */}
      <Card className="p-6 bg-blue-50/50 border-blue-200/50">
        <h3 className="font-semibold text-foreground mb-3">
          About Your Transaction Ledger
        </h3>
        <ul className="space-y-2 text-sm text-foreground">
          <li>
            ✓ <strong>Immutable Records:</strong> Every transaction is permanently
            recorded and cannot be modified after creation
          </li>
          <li>
            ✓ <strong>Complete History:</strong> Access your entire transaction
            history with full details and timestamps
          </li>
          <li>
            ✓ <strong>Reference Tracking:</strong> Use idempotency keys (Reference
            IDs) to track and prevent duplicate transfers
          </li>
          <li>
            ✓ <strong>Status Visibility:</strong> Monitor transaction status from
            PENDING to SUCCESS or FAILED
          </li>
        </ul>
      </Card>
    </div>
  );
}
