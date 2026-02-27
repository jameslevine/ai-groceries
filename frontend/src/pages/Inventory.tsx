import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Card, CardContent, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Add, Kitchen } from '@mui/icons-material';

export const Inventory = () => {
    const { t } = useTranslation();

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {t('inventory.title')}
                </Typography>
                <Button variant="contained" startIcon={<Add />}>
                    {t('inventory.addItem')}
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Chip label={t('inventory.allItems')} color="primary" variant="filled" sx={{ width: '100%' }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Chip label={t('inventory.lowStock')} color="warning" variant="outlined" sx={{ width: '100%' }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Chip label={t('inventory.expired')} color="error" variant="outlined" sx={{ width: '100%' }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Chip label={t('inventory.locations')} color="info" variant="outlined" sx={{ width: '100%' }} />
                </Grid>
            </Grid>

            <Card sx={{ textAlign: 'center', py: 8 }}>
                <CardContent>
                    <Kitchen sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {t('inventory.emptyState')}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};
