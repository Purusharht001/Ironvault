// User & Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  accountNumber: string;
  createdAt: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Account & Balance
export interface Account {
  id: string;
  accountNumber: string;
  balanceCents: number; // Always stored in cents
  userId: string;
  createdAt: string;
}

// Transactions
export type TransactionType = 'SEND' | 'RECEIVE';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Transaction {
  id: string;
  referenceId: string; // Idempotency key
  type: TransactionType;
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amountCents: number; // Always stored in cents
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

// Transfer Request
export interface TransferRequest {
  toAccountNumber: string;
  amountCents: number;
  referenceId: string; // Idempotency key for idempotency
}

// API Response wrapper
export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Stats
export interface MonthlyStats {
  totalSentCents: number;
  totalReceivedCents: number;
  transferCount: number;
}
