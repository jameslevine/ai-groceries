import { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    Link,
    InputAdornment,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useStore } from '../store';
import { apiClient } from '../services/apiClient';
import { ROUTES } from '../constants/routes';

const loginSchema = Yup.object({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
});

interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
    tokenType: string;
}

interface UserProfile {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    familyId?: string;
}

export const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { setUser, setAuthTokens } = useStore();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get the redirect path if user was sent here from a protected route
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD;

    const formik = useFormik({
        initialValues: { email: '', password: '' },
        validationSchema: loginSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setError(null);
            try {
                const response = await apiClient.post<LoginResponse>('/auth/login', values);

                // Store all tokens (access, refresh, id)
                setAuthTokens({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
                    idToken: response.idToken,
                });

                // Fetch user profile
                const user = await apiClient.get<UserProfile>('/users/me');
                setUser(user);

                navigate(from, { replace: true });
            } catch (err: unknown) {
                const error = err as { response?: { status?: number; data?: { message?: string } } };
                const status = error.response?.status;
                const message = error.response?.data?.message || 'Login failed. Please check your credentials.';

                // Handle unverified email - redirect to verify page
                if (status === 403 && message.toLowerCase().includes('verify')) {
                    navigate(ROUTES.VERIFY_EMAIL, { state: { email: values.email } });
                    return;
                }

                setError(message);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                p: 2,
            }}
        >
            <Card sx={{ maxWidth: 440, width: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            sx={{
                                width: 56,
                                height: 56,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #2E7D32, #FF6F00)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '1.5rem',
                                mx: 'auto',
                                mb: 2,
                            }}
                        >
                            AI
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {t('auth.login')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('app.tagline')}
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={formik.handleSubmit}>
                        <TextField
                            fullWidth
                            id="email"
                            name="email"
                            label={t('auth.email')}
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            id="password"
                            name="password"
                            label={t('auth.password')}
                            type={showPassword ? 'text' : 'password'}
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 1 }}
                        />

                        <Box sx={{ textAlign: 'right', mb: 2 }}>
                            <Link component={RouterLink} to={ROUTES.FORGOT_PASSWORD} variant="body2">
                                {t('auth.forgotPassword')}
                            </Link>
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={formik.isSubmitting}
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            {formik.isSubmitting ? <CircularProgress size={24} /> : t('auth.signIn')}
                        </Button>

                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            {t('auth.noAccount')}{' '}
                            <Link component={RouterLink} to={ROUTES.REGISTER}>
                                {t('auth.signUp')}
                            </Link>
                        </Typography>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};
