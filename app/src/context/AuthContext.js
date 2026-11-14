import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api, { setAuthToken, setUnauthorizedHandler } from "../api";

const TOKEN_KEY = "finalert.token";
const USER_KEY = "finalert.user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  }, []);

  // Restore a saved session on launch
  useEffect(() => {
    (async () => {
      try {
        const [token, savedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (token && savedUser) {
          setAuthToken(token);
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // ignore: user just has to log in again
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  // Expired/invalid token → back to login
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/admin/auth/login", { email: email.trim(), password });
    const { token, admin } = res.data;
    setAuthToken(token);
    setUser(admin);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(admin));
    return admin;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/admin/auth/logout");
    } catch {
      // logging out locally is enough
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo(() => {
    const role = user?.role;
    return {
      user,
      booting,
      login,
      logout,
      isLoggedIn: !!user,
      // Mirrors the backend's role → permission table
      canResolve: ["technician", "admin", "super_admin"].includes(role),
      canDelete: ["admin", "super_admin"].includes(role),
      // GET /admin/auth/all-admins and DELETE /admin/auth/:id are super_admin-only on the server
      canManageUsers: role === "super_admin",
    };
  }, [user, booting, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
