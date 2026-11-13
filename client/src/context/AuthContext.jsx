import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
const C = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    setUser(data);
    return data;
  };
  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
  };
  return (
    <C.Provider value={{ user, loading, login, logout }}>{children}</C.Provider>
  );
}
export const useAuth = () => useContext(C);
