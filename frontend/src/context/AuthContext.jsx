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
      const storedToken = localStorage.getItem("teampulse_token");
      const storedRefreshToken = localStorage.getItem("teampulse_refresh_token");

      if (!storedToken && !storedRefreshToken) {
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
        console.warn("Auth check failed:", err.message);
        localStorage.removeItem("teampulse_token");
        localStorage.removeItem("teampulse_refresh_token");
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
      const { token: accessToken, refreshToken, user: userData } = res.data;
      localStorage.setItem("teampulse_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("teampulse_refresh_token", refreshToken);
      }
      setToken(accessToken);
      setUser(userData);
      joinUserRoom(userData.id);
      return userData;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.data.success) {
      const { token: accessToken, refreshToken, user: registeredUser } = res.data;
      localStorage.setItem("teampulse_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("teampulse_refresh_token", refreshToken);
      }
      setToken(accessToken);
      setUser(registeredUser);
      joinUserRoom(registeredUser.id);
      return registeredUser;
    }
    throw new Error(res.data.message || "Registration failed");
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("teampulse_token");
      localStorage.removeItem("teampulse_refresh_token");
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
