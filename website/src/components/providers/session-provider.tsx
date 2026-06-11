"use client";

import { useState, createContext, useContext } from "react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface SessionContextType {
  customer: Customer | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType>({
  customer: null,
  token: null,
  isLoggedIn: false,
  isLoading: false,
  login: () => {},
  logout: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

function loadSession(): { token: string | null; customer: Customer | null } {
  if (typeof window === "undefined") return { token: null, customer: null };
  try {
    const stored = localStorage.getItem("city-tools-session");
    if (stored) {
      const session = JSON.parse(stored);
      return { token: session.token, customer: session.customer };
    }
  } catch {
    localStorage.removeItem("city-tools-session");
  }
  return { token: null, customer: null };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(() => {
    const s = loadSession();
    return { ...s, isLoggedIn: !!s.token };
  });

  const login = (newToken: string, newCustomer: Customer) => {
    setState({ token: newToken, customer: newCustomer, isLoggedIn: true });
    localStorage.setItem(
      "city-tools-session",
      JSON.stringify({ token: newToken, customer: newCustomer })
    );
  };

  const logout = () => {
    setState({ token: null, customer: null, isLoggedIn: false });
    localStorage.removeItem("city-tools-session");
  };

  return (
    <SessionContext.Provider
      value={{
        customer: state.customer,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        isLoading: false,
        login,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
