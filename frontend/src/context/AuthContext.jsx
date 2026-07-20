import React, { createContext, useState, useEffect, useContext } from "react";
import apiClient from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-verify token validity on mount
  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("Token verification failed:", err);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    // FastAPI standard OAuth2 login uses form-urlencoded format
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    const res = await apiClient.post("/auth/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    
    // Fetch and cache user profile
    const userRes = await apiClient.get("/auth/me");
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (email, password) => {
    const res = await apiClient.post("/auth/register", { email, password });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
