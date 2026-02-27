import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useStore } from '../store';
import { ROUTES } from '../constants/routes';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { token, isAuthenticated, globalLoading } = useStore();
    const location = useLocation();

    // If no token at all, redirect to login
    if (!token) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // If we have a token but are still loading user data, show spinner
    if (globalLoading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress size={48} />
            </Box>
        );
    }

    // If token exists but user is not authenticated (fetch failed), redirect
    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
