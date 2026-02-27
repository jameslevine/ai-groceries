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
    CircularProgress,
} from '@mui/material';
import { Email, Pin } from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import { ROUTES } from '../constants/routes';

const verifySchema = Yup.object({
    email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
    code: Yup.string()
        .length(6, 'Verification code must be 6 digits')
        .matches(/^\d+$/, 'Code must contain only numbers')
        .required('Verification code is required'),
});

export const VerifyEmail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Pre-fill email if passed from registration
    const emailFromState = (location.state as { email?: string })?.email || '';

    const formik = useFormik({
        initialValues: { email: emailFromState, code: '' },
        validationSchema: verifySchema,
        onSubmit: async (values, { setSubmitting }) => {
            setError(null);
            try {
                await apiClient.post('/auth/verify', {
                    email: values.email,
                    code: values.code,
                });
                setSuccess(true);
                setTimeout(() => navigate(ROUTES.LOGIN), 2000);
            } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } } };
                const message =
                    error.response?.data?.message || 'Verification failed. Please try again.';
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
                            {t('auth.verifyEmail')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Enter the 6-digit code sent to your email address
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Email verified successfully! Redirecting to login...
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
                            id="code"
                            name="code"
                            label={t('auth.verificationCode')}
                            value={formik.values.code}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.code && Boolean(formik.errors.code)}
                            helperText={formik.touched.code && formik.errors.code}
                            placeholder="000000"
                            inputProps={{ maxLength: 6 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Pin />
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
                                'Verify Email'
                            )}
                        </Button>

                        <Typography variant="body2" sx={{ textAlign: 'center' }}>
                            Already verified?{' '}
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
