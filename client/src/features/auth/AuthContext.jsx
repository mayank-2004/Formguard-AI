import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js"

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = useCallback(async () => {
        try {
            const result = await apiRequest("/auth/me");

            setUser(result.user || null);
            return result.user || null;
        } catch (error) {
            setUser(null);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const register = useCallback(async (details) => {
        const result = await apiRequest("/auth/register", {
            method: "POST",
            body: details,
        });

        setUser(result.user);

        return result.user;
    }, []);

    const login = useCallback(async (credentials) => {
        const result = await apiRequest("/auth/login", {
            method: "POST",
            body: credentials,
        });
        setUser(result.user);

        return result.user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiRequest("/auth/logout", {
                method: "POST",
            });
        } finally {
            setUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{user,loading, register, login, logout, refreshUser,}}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider.");
    }

    return context;
}