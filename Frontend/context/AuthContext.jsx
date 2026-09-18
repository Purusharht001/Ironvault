'use client';
import { createContext, useCallback, useEffect, useMemo, useState, } from 'react';
import { api } from '@/lib/api';
import { LOCAL_STORAGE_KEYS, UNAUTHORIZED_EVENT } from '@/lib/constants';
export const AuthContext = createContext(undefined);
export function AuthProvider({ children, }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const clearSession = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        setToken(null);
        setUser(null);
    }, []);
    // Store a fresh token + user (sign in, sign up, logout-all, password change)
    const setSession = useCallback((newToken, newUser) => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, newToken);
        setToken(newToken);
        if (newUser)
            setUser(newUser);
    }, []);
    const checkAuth = useCallback(async () => {
        const savedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        if (!savedToken)
            return;
        setToken(savedToken);
        try {
            const userData = await api.auth.getUser();
            setUser(userData);
        }
        catch (error) {
            // Only drop the session if the server rejected it, not on a network blip
            if (error.status === 401 || error.status === 404) {
                clearSession();
            }
        }
    }, [clearSession]);
    // Check if user is authenticated on mount
    useEffect(() => {
        checkAuth().finally(() => setIsLoading(false));
    }, [checkAuth]);
    // Any 401 from an authenticated request means the session was revoked or expired
    useEffect(() => {
        window.addEventListener(UNAUTHORIZED_EVENT, clearSession);
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession);
    }, [clearSession]);
    const signUp = useCallback(async (username, email, password) => {
        const response = await api.auth.signUp({ username, email, password });
        setSession(response.token, response.user);
    }, [setSession]);
    const signIn = useCallback(async (email, password) => {
        const response = await api.auth.signIn({ email, password });
        setSession(response.token, response.user);
    }, [setSession]);
    const value = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated: !!user && !!token,
        token,
        signUp,
        signIn,
        logout: clearSession,
        setSession,
        checkAuth,
    }), [user, isLoading, token, signUp, signIn, clearSession, setSession, checkAuth]);
    return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
}
