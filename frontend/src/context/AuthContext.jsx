import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api.js";
import { joinUserRoom } from "../services/socket.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("teampulse_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        if (res.data.success) {
          setUser(res.data.user);
          joinUserRoom(res.data.user.id);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        localStorage.removeItem("teampulse_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.success) {
      localStorage.setItem("teampulse_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      joinUserRoom(res.data.user.id);
      return res.data.user;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.data.success) {
      localStorage.setItem("teampulse_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      joinUserRoom(res.data.user.id);
      return res.data.user;
    }
    throw new Error(res.data.message || "Registration failed");
  };

  const logout = () => {
    localStorage.removeItem("teampulse_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
