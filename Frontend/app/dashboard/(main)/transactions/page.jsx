'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { UI } from '@/lib/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { TransactionFilters } from '@/components/dashboard/TransactionFilters';
import { TransactionTable } from '@/components/dashboard/TransactionTable';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [rangeFilter, setRangeFilter] = useState('all');
    const debouncedSearch = useDebounce(searchQuery.trim(), UI.SEARCH_DEBOUNCE_MS);
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(UI.DEFAULT_PAGE_SIZE);
    const [total, setTotal] = useState(0);
    // Any filter change starts over at page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, statusFilter, typeFilter, rangeFilter]);
    // Fetch transactions
    useEffect(() => {
        let cancelled = false; // ignore responses that arrive after newer filters were applied
        const fetchTransactions = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await api.transaction.list({
                    page: currentPage,
                    limit: pageSize,
                    status: statusFilter || undefined,
                    type: typeFilter || undefined,
                    search: debouncedSearch || undefined,
                    rangeType: rangeFilter,
                });
                if (cancelled)
                    return;
                setTransactions(response.transactions);
                setTotal(response.total);
            }
            catch (err) {
                if (cancelled)
                    return;
                const errorMessage = err instanceof Error ? err.message : 'Failed to load transactions';
                setError(errorMessage);
                toast.error(errorMessage);
            }
            finally {
                if (!cancelled)
                    setIsLoading(false);
            }
        };
        fetchTransactions();
        return () => {
            cancelled = true;
        };
    }, [currentPage, pageSize, statusFilter, typeFilter, debouncedSearch, rangeFilter]);
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };
    const totalPages = Math.ceil(total / pageSize);
    return (<div className="space-y-8">
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
        <TransactionFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusChange={setStatusFilter} typeFilter={typeFilter} onTypeChange={setTypeFilter} rangeFilter={rangeFilter} onRangeChange={setRangeFilter}/>
      </Card>

      {/* Transactions Table */}
      {error ? (<Card className="p-6 bg-destructive/10 border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </Card>) : (<Card className="p-4 sm:p-6">
          <TransactionTable transactions={transactions} isLoading={isLoading} currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageSize={pageSize} onPageSizeChange={handlePageSizeChange} total={total}/>
        </Card>)}

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
            ✓ <strong>Complete History:</strong> Click any row to see full details,
            including the reference ID and both account numbers
          </li>
          <li>
            ✓ <strong>Reference Tracking:</strong> Use idempotency keys (Reference
            IDs) to track and prevent duplicate transfers
          </li>
          <li>
            ✓ <strong>Failed Attempts:</strong> Rejected transfers (e.g. insufficient
            funds) are recorded as FAILED and never move money
          </li>
        </ul>
      </Card>
    </div>);
}
