import { API_ENDPOINTS, ERROR_MESSAGES, LOCAL_STORAGE_KEYS, UNAUTHORIZED_EVENT } from './constants';
// Helper function to get auth token
function getAuthToken() {
    if (typeof window === 'undefined')
        return null;
    return localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
}
// Helper function to handle API responses
async function handleResponse(response, hadToken) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(data?.message || ERROR_MESSAGES.SERVER_ERROR);
        error.status = response.status;
        error.code = data?.code;
        error.data = data;
        // An authenticated request was rejected: the session is gone (expired or revoked).
        if (response.status === 401 && hadToken && typeof window !== 'undefined') {
            window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
        }
        throw error;
    }
    return data;
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
        const error = new Error(ERROR_MESSAGES.NETWORK_ERROR);
        error.isNetworkError = true;
        throw error;
    });
    return handleResponse(response, Boolean(token));
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
    logoutAll: async () => {
        return apiRequest(API_ENDPOINTS.LOGOUT_ALL, { method: 'POST' });
    },
    changePassword: async (data) => {
        return apiRequest(API_ENDPOINTS.CHANGE_PASSWORD, {
            method: 'POST',
            body: JSON.stringify(data),
        });
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
    getActivity: async (days = 30) => {
        return apiRequest(`${API_ENDPOINTS.GET_ACTIVITY}?days=${days}`);
    },
    lookup: async (accountNumber) => {
        return apiRequest(API_ENDPOINTS.LOOKUP_ACCOUNT(accountNumber));
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
        if (params?.type)
            queryParams.append('type', params.type);
        if (params?.search)
            queryParams.append('search', params.search);
        if (params?.rangeType)
            queryParams.append('rangeType', params.rangeType);
        const query = queryParams.toString();
        const url = query
            ? `${API_ENDPOINTS.GET_TRANSACTIONS}?${query}`
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
