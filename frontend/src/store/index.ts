import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  familyId?: string;
}

interface ShoppingList {
  listId: string;
  name: string;
  items: unknown[];
  isFavourite: boolean;
  createdAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setAuthTokens: (tokens: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
  }) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;

  // Theme
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;

  // Shopping Lists
  shoppingLists: ShoppingList[];
  setShoppingLists: (lists: ShoppingList[]) => void;
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;

  // Navigation
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Loading
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  token: localStorage.getItem('auth_token'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    set({ token });
  },
  setAuthTokens: ({ accessToken, refreshToken, idToken }) => {
    localStorage.setItem('auth_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    if (idToken) {
      localStorage.setItem('id_token', idToken);
    }
    set({ token: accessToken });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('id_token');
    set({ user: null, isAuthenticated: false, token: null });
  },
  initializeAuth: async () => {
    const token = get().token;
    if (!token) {
      set({ globalLoading: false });
      return;
    }

    set({ globalLoading: true });
    try {
      const user = await apiClient.get<User>('/users/me');
      set({ user, isAuthenticated: true, globalLoading: false });
    } catch {
      // Token is invalid or expired - the interceptor will handle refresh
      // If refresh also fails, the interceptor will clear tokens and redirect
      set({ user: null, isAuthenticated: false, globalLoading: false });
    }
  },

  // Theme
  themeMode:
    (localStorage.getItem('theme_mode') as 'light' | 'dark') || 'light',
  toggleTheme: () =>
    set((state) => {
      const newMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme_mode', newMode);
      return { themeMode: newMode };
    }),

  // Shopping Lists
  shoppingLists: [],
  setShoppingLists: (lists) => set({ shoppingLists: lists }),
  activeListId: null,
  setActiveListId: (id) => set({ activeListId: id }),

  // Navigation
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Loading
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
