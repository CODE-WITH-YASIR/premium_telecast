"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useToast } from "./ToastContext";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export interface HistoryItem {
  channelId: string;
  name: string;
  logo?: string;
  watchedAt: number;
  durationSeconds?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionToken: string | null;
  favorites: string[];
  history: HistoryItem[];
  isFavorite: (channelId: string) => boolean;
  toggleFavorite: (channelId: string, channelName?: string, channelLogo?: string) => Promise<void>;
  recordWatch: (
    channelId: string,
    channelName: string,
    channelLogo?: string,
    durationSeconds?: number
  ) => Promise<void>;
  removeHistoryEntry: (channelId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateProfile: (name: string, email?: string) => Promise<void>;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password?: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOCAL_FAVORITES_KEY = "premium-live-tv:favorites:v2";
const LOCAL_HISTORY_KEY = "premium-live-tv:history:v2";
const LOCAL_USER_KEY = "premium-live-tv:user-profile:v2";

const DEFAULT_USER: AuthUser = {
  id: "usr_admin",
  email: "mohamedyasir2000@gmail.com",
  name: "Mohamed Yasir",
  role: "admin",
};

function readLocalFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(favs: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favs));
  } catch {
    // ignore
  }
}

function readLocalHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function readLocalUser(): AuthUser {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

function writeLocalUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_USER);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");

  // Load client-side browser bookmarks, history, and profile on initial mount
  useEffect(() => {
    setFavorites(readLocalFavorites());
    setHistory(readLocalHistory());
    setUser(readLocalUser());
  }, []);

  const updateProfile = useCallback(
    async (name: string, email?: string) => {
      const updated: AuthUser = {
        id: user?.id || "usr_local",
        name: name.trim() || "User",
        email: email?.trim() || user?.email || "user@premiumtv.live",
        role: "admin",
      };
      setUser(updated);
      writeLocalUser(updated);
      showToast("Profile settings updated", { type: "success" });
    },
    [user, showToast]
  );

  const login = useCallback(
    async (email: string) => {
      const displayName = email.split("@")[0] || "User";
      const loggedUser: AuthUser = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        email: email.trim(),
        name: displayName,
        role: "admin",
      };
      setUser(loggedUser);
      writeLocalUser(loggedUser);
      setIsAuthModalOpen(false);
      showToast(`Welcome, ${displayName}!`, { type: "success" });
      return { success: true };
    },
    [showToast]
  );

  const signup = useCallback(
    async (email: string, _password?: string, name?: string) => {
      const displayName = name?.trim() || email.split("@")[0] || "User";
      const newUser: AuthUser = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        email: email.trim(),
        name: displayName,
        role: "admin",
      };
      setUser(newUser);
      writeLocalUser(newUser);
      setIsAuthModalOpen(false);
      showToast(`Account created! Welcome, ${displayName}!`, { type: "success" });
      return { success: true };
    },
    [showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    const googleUser: AuthUser = {
      id: "usr_google_user",
      email: "google.user@example.com",
      name: "Google User",
      role: "admin",
    };
    setUser(googleUser);
    writeLocalUser(googleUser);
    setIsAuthModalOpen(false);
    showToast("Signed in with Google", { type: "success" });
    return { success: true };
  }, [showToast]);

  const logout = useCallback(async () => {
    setUser(DEFAULT_USER);
    writeLocalUser(DEFAULT_USER);
    showToast("Reset to default profile", { type: "info" });
  }, [showToast]);

  const isFavorite = useCallback(
    (channelId: string) => favorites.includes(channelId),
    [favorites]
  );

  // Stable toggleFavorite
  const toggleFavorite = useCallback(
    async (channelId: string, channelName = "Channel") => {
      setFavorites((prevFavorites) => {
        const active = prevFavorites.includes(channelId);
        const nextFavorites = active
          ? prevFavorites.filter((id) => id !== channelId)
          : [...prevFavorites, channelId];

        writeLocalFavorites(nextFavorites);

        showToast(
          active
            ? `Removed "${channelName}" from favorites`
            : `Added "${channelName}" to favorites`,
          { type: active ? "info" : "success" }
        );

        return nextFavorites;
      });
    },
    [showToast]
  );

  // Stable recordWatch
  const recordWatch = useCallback(
    async (
      channelId: string,
      channelName: string,
      channelLogo?: string,
      durationSeconds = 0
    ) => {
      const now = Date.now();
      setHistory((prevHistory) => {
        const updatedHistory = [
          { channelId, name: channelName, logo: channelLogo, watchedAt: now, durationSeconds },
          ...prevHistory.filter((h) => h.channelId !== channelId),
        ].slice(0, 50);

        writeLocalHistory(updatedHistory);
        return updatedHistory;
      });
    },
    []
  );

  // Stable removeHistoryEntry
  const removeHistoryEntry = useCallback(
    async (channelId: string) => {
      setHistory((prevHistory) => {
        const updatedHistory = prevHistory.filter((h) => h.channelId !== channelId);
        writeLocalHistory(updatedHistory);
        return updatedHistory;
      });
    },
    []
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    writeLocalHistory([]);
    showToast("Watch history cleared", { type: "info" });
  }, [showToast]);

  const openAuthModal = useCallback((mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: true,
        isAdmin: true,
        sessionToken: "local_admin_session",
        favorites,
        history,
        isFavorite,
        toggleFavorite,
        recordWatch,
        removeHistoryEntry,
        clearHistory,
        updateProfile,
        login,
        signup,
        loginWithGoogle,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

