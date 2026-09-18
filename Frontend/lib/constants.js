// API Base URL - set NEXT_PUBLIC_API_BASE_URL in .env.local to point elsewhere
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    SIGN_UP: `${API_BASE_URL}/auth/signup`,
    SIGN_IN: `${API_BASE_URL}/auth/signin`,
    GET_USER: `${API_BASE_URL}/auth/me`,
    LOGOUT_ALL: `${API_BASE_URL}/auth/logout-all`,
    CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
    // Account
    GET_ACCOUNT: `${API_BASE_URL}/account`,
    GET_BALANCE: `${API_BASE_URL}/account/balance`,
    GET_MONTHLY_STATS: `${API_BASE_URL}/account/stats`,
    GET_ACTIVITY: `${API_BASE_URL}/account/activity`,
    LOOKUP_ACCOUNT: (accountNumber) => `${API_BASE_URL}/account/lookup/${accountNumber}`,
    // Transactions
    GET_TRANSACTIONS: `${API_BASE_URL}/transactions`,
    GET_TRANSACTION: (id) => `${API_BASE_URL}/transactions/${id}`,
    CREATE_TRANSFER: `${API_BASE_URL}/transfers`,
};
// Validation rules
export const VALIDATION = {
    ACCOUNT_NUMBER_LENGTH: 12,
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 32,
    MAX_TRANSFER_AMOUNT_CENTS: 999999999, // ~9,999,999.99
    MIN_TRANSFER_AMOUNT_CENTS: 1, // $0.01
    MAX_NOTE_LENGTH: 140,
};
// Error messages
export const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_EXISTS: 'Email already registered',
    USERNAME_TAKEN: 'Username already taken',
    INSUFFICIENT_FUNDS: 'Insufficient funds for this transfer',
    DUPLICATE_REQUEST_KEY: 'This transfer request has already been processed',
    INVALID_ACCOUNT_NUMBER: 'Invalid recipient account number',
    INVALID_AMOUNT: 'Transfer amount must be positive',
    NETWORK_ERROR: 'Cannot reach the IronVault server. Check your connection and try again',
    SERVER_ERROR: 'Server error. Please try again later',
    UNAUTHORIZED: 'You are not authorized. Please sign in again',
    NOT_FOUND: 'Resource not found',
};
// Format constants
export const FORMATS = {
    CENT_DIVISOR: 100, // Convert cents to dollars
    CURRENCY: 'USD',
    CURRENCY_SYMBOL: '$',
    DECIMAL_PLACES: 2,
    DATE_FORMAT: 'MMM dd, yyyy',
    TIME_FORMAT: 'hh:mm a',
};
// UI Constants
export const UI = {
    TOAST_DURATION: 3000, // ms
    LOADING_SKELETON_ITEMS: 3,
    PAGE_SIZE_OPTIONS: [10, 25, 50],
    DEFAULT_PAGE_SIZE: 25,
    SEARCH_DEBOUNCE_MS: 350,
};
// Local Storage Keys
export const LOCAL_STORAGE_KEYS = {
    AUTH_TOKEN: 'ironvault_auth_token',
    USER: 'ironvault_user',
};
// Fired on window when any authenticated request gets a 401
export const UNAUTHORIZED_EVENT = 'ironvault:unauthorized';
