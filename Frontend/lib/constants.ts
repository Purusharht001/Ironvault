// API Base URL - Update this when connecting to real backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  SIGN_UP: `${API_BASE_URL}/auth/signup`,
  SIGN_IN: `${API_BASE_URL}/auth/signin`,
  GET_USER: `${API_BASE_URL}/auth/me`,

  // Account
  GET_ACCOUNT: `${API_BASE_URL}/account`,
  GET_BALANCE: `${API_BASE_URL}/account/balance`,

  // Transactions
  GET_TRANSACTIONS: `${API_BASE_URL}/transactions`,
  GET_TRANSACTION: (id: string) => `${API_BASE_URL}/transactions/${id}`,
  CREATE_TRANSFER: `${API_BASE_URL}/transfers`,
  GET_MONTHLY_STATS: `${API_BASE_URL}/account/stats`,
} as const;

// Validation rules
export const VALIDATION = {
  ACCOUNT_NUMBER_LENGTH: 12,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 32,
  MAX_TRANSFER_AMOUNT_CENTS: 999999999, // ~9,999,999.99
  MIN_TRANSFER_AMOUNT_CENTS: 1, // $0.01
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  USERNAME_TAKEN: 'Username already taken',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transfer',
  DUPLICATE_REQUEST_KEY: 'This transfer request has already been processed',
  INVALID_ACCOUNT_NUMBER: 'Invalid recipient account number',
  INVALID_AMOUNT: 'Transfer amount must be positive',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  SERVER_ERROR: 'Server error. Please try again later',
  UNAUTHORIZED: 'You are not authorized. Please sign in again',
  NOT_FOUND: 'Resource not found',
} as const;

// Format constants
export const FORMATS = {
  CENT_DIVISOR: 100, // Convert cents to dollars
  CURRENCY_SYMBOL: '$',
  DECIMAL_PLACES: 2,
  DATE_FORMAT: 'MMM dd, yyyy',
  TIME_FORMAT: 'hh:mm a',
} as const;

// UI Constants
export const UI = {
  TOAST_DURATION: 3000, // ms
  LOADING_SKELETON_ITEMS: 3,
  PAGE_SIZE_OPTIONS: [10, 25, 50],
  DEFAULT_PAGE_SIZE: 25,
} as const;

// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'irrvault_auth_token',
  USER: 'ironvault_user',
} as const;
