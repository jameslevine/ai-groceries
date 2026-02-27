import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
import {
    Visibility,
    VisibilityOff,
    Email,
    Lock,
    Person,
} from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { ROUTES } from '../constants/routes';

const registerSchema = Yup.object({
    firstName: Yup.string()
        .min(1, 'First name is required')
        .max(100)
        .required('First name is required'),
    lastName: Yup.string()
        .min(1, 'Last name is required')
        .max(100)
        .required('Last name is required'),
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Must contain at least one number')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password'),
});

export const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const formik = useFormik({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        validationSchema: registerSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setError(null);
            try {
                await apiClient.post('/auth/register', {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    password: values.password,
                });
                setSuccess(true);
                // Redirect to verify email page after 2 seconds with email pre-filled
                setTimeout(() => navigate(ROUTES.VERIFY_EMAIL, { state: { email: values.email } }), 2000);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } };
                const message =
                    error.response?.data?.message ||
                    'Registration failed. Please try again.';
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
                            {t('auth.register')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Join AI Groceries and start saving on your weekly shop
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Account created! Please check your email for a verification code.
                        </Alert>
                    )}

                    <form onSubmit={formik.handleSubmit}>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <TextField
                                fullWidth
                                id="firstName"
                                name="firstName"
                                label={t('auth.firstName')}
                                value={formik.values.firstName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                helperText={formik.touched.firstName && formik.errors.firstName}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                fullWidth
                                id="lastName"
                                name="lastName"
                                label={t('auth.lastName')}
                                value={formik.values.lastName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                helperText={formik.touched.lastName && formik.errors.lastName}
                            />
                        </Box>

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
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            id="confirmPassword"
                            name="confirmPassword"
                            label={t('auth.confirmPassword')}
                            type={showPassword ? 'text' : 'password'}
                            value={formik.values.confirmPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={formik.isSubmitting || success}
                            sx={{ mb: 2, py: 1.5 }}
                        >
                            {formik.isSubmitting ? (
                                <CircularProgress size={24} />
                            ) : (
                                t('auth.signUp')
                            )}
                        </Button>

                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            {t('auth.hasAccount')}{' '}
                            <Link component={RouterLink} to={ROUTES.LOGIN}>
                                {t('auth.signIn')}
                            </Link>
                        </Typography>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};
