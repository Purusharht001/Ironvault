import { API_ENDPOINTS, ERROR_MESSAGES, LOCAL_STORAGE_KEYS } from './constants';
// Helper function to get auth token
function getAuthToken() {
    if (typeof window === 'undefined')
        return null;
    return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
}
// Helper function to handle API responses
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.message || ERROR_MESSAGES.SERVER_ERROR;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = errorData?.code;
        throw error;
    }
    return response.json();
}
// Fetch wrapper with auth header
async function apiRequest(url, options = {}) {
    const token = getAuthToken();
    const headers = {
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
    return handleResponse(response);
}
// ============ AUTH ENDPOINTS ============
export const authAPI = {
    signUp: async (data) => {
        return apiRequest(API_ENDPOINTS.SIGN_UP, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    signIn: async (data) => {
        return apiRequest(API_ENDPOINTS.SIGN_IN, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    getUser: async () => {
        return apiRequest(API_ENDPOINTS.GET_USER);
    },
};
// ============ ACCOUNT ENDPOINTS ============
export const accountAPI = {
    getAccount: async () => {
        return apiRequest(API_ENDPOINTS.GET_ACCOUNT);
    },
    getBalance: async () => {
        return apiRequest(API_ENDPOINTS.GET_BALANCE);
    },
    getMonthlyStats: async () => {
        return apiRequest(API_ENDPOINTS.GET_MONTHLY_STATS);
    },
};
// ============ TRANSACTION ENDPOINTS ============
export const transactionAPI = {
    list: async (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page)
            queryParams.append('page', String(params.page));
        if (params?.limit)
            queryParams.append('limit', String(params.limit));
        if (params?.status)
            queryParams.append('status', params.status);
        if (params?.search)
            queryParams.append('search', params.search);
        if (params?.rangeType)
            queryParams.append('rangeType', params.rangeType);
        const url = queryParams.size > 0
            ? `${API_ENDPOINTS.GET_TRANSACTIONS}?${queryParams}`
            : API_ENDPOINTS.GET_TRANSACTIONS;
        return apiRequest(url);
    },
    get: async (id) => {
        return apiRequest(API_ENDPOINTS.GET_TRANSACTION(id));
    },
    createTransfer: async (data) => {
        return apiRequest(API_ENDPOINTS.CREATE_TRANSFER, {
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
