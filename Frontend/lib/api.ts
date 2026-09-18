import { API_ENDPOINTS, ERROR_MESSAGES, LOCAL_STORAGE_KEYS } from './constants';
import type {
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  User,
  Account,
  Transaction,
  TransferRequest,
  ApiResponse,
  MonthlyStats,
} from './types';

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData?.message || ERROR_MESSAGES.SERVER_ERROR;

    const error = new Error(errorMessage) as Error & {
      status?: number;
      code?: string;
    };
    error.status = response.status;
    error.code = errorData?.code;

    throw error;
  }

  return response.json();
}

// Fetch wrapper with auth header
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  }).catch(() => {
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  });

  return handleResponse<T>(response);
}

// ============ AUTH ENDPOINTS ============

export const authAPI = {
  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>(API_ENDPOINTS.SIGN_UP, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>(API_ENDPOINTS.SIGN_IN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getUser: async (): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.GET_USER);
  },
};

// ============ ACCOUNT ENDPOINTS ============

export const accountAPI = {
  getAccount: async (): Promise<Account> => {
    return apiRequest<Account>(API_ENDPOINTS.GET_ACCOUNT);
  },

  getBalance: async (): Promise<{ balanceCents: number }> => {
    return apiRequest<{ balanceCents: number }>(
      API_ENDPOINTS.GET_BALANCE
    );
  },

  getMonthlyStats: async (): Promise<MonthlyStats> => {
    return apiRequest<MonthlyStats>(API_ENDPOINTS.GET_MONTHLY_STATS);
  },
};

// ============ TRANSACTION ENDPOINTS ============

export const transactionAPI = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    rangeType?: 'week' | 'month' | 'all';
  }): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.rangeType) queryParams.append('rangeType', params.rangeType);

    const url =
      queryParams.size > 0
        ? `${API_ENDPOINTS.GET_TRANSACTIONS}?${queryParams}`
        : API_ENDPOINTS.GET_TRANSACTIONS;

    return apiRequest(url);
  },

  get: async (id: string): Promise<Transaction> => {
    return apiRequest<Transaction>(API_ENDPOINTS.GET_TRANSACTION(id));
  },

  createTransfer: async (data: TransferRequest): Promise<Transaction> => {
    return apiRequest<Transaction>(API_ENDPOINTS.CREATE_TRANSFER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Unified API export
export const api = {
  auth: authAPI,
  account: accountAPI,
  transaction: transactionAPI,
};

export type { ApiResponse };
