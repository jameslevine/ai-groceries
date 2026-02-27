import { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppTheme } from './styles/theme';
import { useStore } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ShoppingLists } from './pages/ShoppingLists';
import { Inventory } from './pages/Inventory';
import { Recipes } from './pages/Recipes';
import { MealPlanner } from './pages/MealPlanner';
import { PriceCompare } from './pages/PriceCompare';
import { AITools } from './pages/AITools';
import { RecipeDetail } from './pages/RecipeDetail';
import { DiscoverRecipes } from './pages/DiscoverRecipes';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ROUTES } from './constants/routes';
import './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const initializeAuth = useStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      {/* Public routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.REGISTER} element={<Register />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.LISTS} element={<ShoppingLists />} />
        <Route path={ROUTES.INVENTORY} element={<Inventory />} />
        <Route path={ROUTES.RECIPES} element={<Recipes />} />
        <Route path={ROUTES.RECIPE_DETAIL} element={<RecipeDetail />} />
        <Route path={ROUTES.DISCOVER_RECIPES} element={<DiscoverRecipes />} />
        <Route path={ROUTES.MEAL_PLANNER} element={<MealPlanner />} />
        <Route path={ROUTES.PRICES} element={<PriceCompare />} />
        <Route path={ROUTES.AI_TOOLS} element={<AITools />} />
      </Route>
    </Routes>
  );
}

function App() {
  const themeMode = useStore((state) => state.themeMode);
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
