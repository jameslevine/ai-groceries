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
    CircularProgress,
} from '@mui/material';
import { Email, Lock, Pin } from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { ROUTES } from '../constants/routes';

const requestResetSchema = Yup.object({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
});

const resetPasswordSchema = Yup.object({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    code: Yup.string()
        .length(6, 'Reset code must be 6 digits')
        .matches(/^\d+$/, 'Code must contain only numbers')
        .required('Reset code is required'),
    newPassword: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Must contain at least one number')
        .required('New password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords must match')
        .required('Please confirm your password'),
});

export const ForgotPassword = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState<'request' | 'reset'>('request');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [emailForReset, setEmailForReset] = useState('');

    const requestFormik = useFormik({
        initialValues: { email: '' },
        validationSchema: requestResetSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setError(null);
            try {
                await apiClient.post('/auth/forgot-password', {
                    email: values.email,
                });
                setEmailForReset(values.email);
                setStep('reset');
            } catch {
                // Backend always returns 200 to prevent email enumeration
                setEmailForReset(values.email);
                setStep('reset');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const resetFormik = useFormik({
        initialValues: { email: emailForReset, code: '', newPassword: '', confirmPassword: '' },
        enableReinitialize: true,
        validationSchema: resetPasswordSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setError(null);
            try {
                await apiClient.post('/auth/reset-password', {
                    email: values.email,
                    code: values.code,
                    newPassword: values.newPassword,
                });
                setSuccess(true);
                setTimeout(() => navigate(ROUTES.LOGIN), 2000);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } };
                const message =
                    error.response?.data?.message || 'Password reset failed. Please try again.';
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
                            {t('auth.resetPassword')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {step === 'request'
                                ? 'Enter your email to receive a reset code'
                                : 'Enter the code and your new password'}
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Password reset successfully! Redirecting to login...
                        </Alert>
                    )}

                    {step === 'request' ? (
                        <form onSubmit={requestFormik.handleSubmit}>
                            <TextField
                                fullWidth
                                id="email"
                                name="email"
                                label={t('auth.email')}
                                value={requestFormik.values.email}
                                onChange={requestFormik.handleChange}
                                onBlur={requestFormik.handleBlur}
                                error={requestFormik.touched.email && Boolean(requestFormik.errors.email)}
                                helperText={requestFormik.touched.email && requestFormik.errors.email}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email />
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
                                disabled={requestFormik.isSubmitting}
                                sx={{ mb: 2, py: 1.5 }}
                            >
                                {requestFormik.isSubmitting ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    'Send Reset Code'
                                )}
                            </Button>

                            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                Remember your password?{' '}
                                <Link component={RouterLink} to={ROUTES.LOGIN}>
                                    {t('auth.signIn')}
                                </Link>
                            </Typography>
                        </form>
                    ) : (
                        <form onSubmit={resetFormik.handleSubmit}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                A reset code has been sent to {emailForReset}
                            </Alert>

                            <TextField
                                fullWidth
                                id="code"
                                name="code"
                                label="Reset Code"
                                value={resetFormik.values.code}
                                onChange={resetFormik.handleChange}
                                onBlur={resetFormik.handleBlur}
                                error={resetFormik.touched.code && Boolean(resetFormik.errors.code)}
                                helperText={resetFormik.touched.code && resetFormik.errors.code}
                                placeholder="000000"
                                inputProps={{ maxLength: 6 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Pin />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                id="newPassword"
                                name="newPassword"
                                label="New Password"
                                type="password"
                                value={resetFormik.values.newPassword}
                                onChange={resetFormik.handleChange}
                                onBlur={resetFormik.handleBlur}
                                error={resetFormik.touched.newPassword && Boolean(resetFormik.errors.newPassword)}
                                helperText={resetFormik.touched.newPassword && resetFormik.errors.newPassword}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                fullWidth
                                id="confirmPassword"
                                name="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                value={resetFormik.values.confirmPassword}
                                onChange={resetFormik.handleChange}
                                onBlur={resetFormik.handleBlur}
                                error={resetFormik.touched.confirmPassword && Boolean(resetFormik.errors.confirmPassword)}
                                helperText={resetFormik.touched.confirmPassword && resetFormik.errors.confirmPassword}
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
                                disabled={resetFormik.isSubmitting || success}
                                sx={{ mb: 2, py: 1.5 }}
                            >
                                {resetFormik.isSubmitting ? (
                                    <CircularProgress size={24} />
                                ) : (
                                    'Reset Password'
                                )}
                            </Button>

                            <Button
                                fullWidth
                                variant="text"
                                onClick={() => {
                                    setStep('request');
                                    setError(null);
                                }}
                                sx={{ mb: 1 }}
                            >
                                Use a different email
                            </Button>

                            <Typography variant="body2" sx={{ textAlign: 'center' }}>
                                <Link component={RouterLink} to={ROUTES.LOGIN}>
                                    Back to {t('auth.signIn')}
                                </Link>
                            </Typography>
                        </form>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};
