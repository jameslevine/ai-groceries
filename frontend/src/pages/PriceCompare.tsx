import { useTranslation } from 'react-i18next';
import { Box, Typography, Card, CardContent, TextField, InputAdornment, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Search, CompareArrows } from '@mui/icons-material';

const UK_STORES = [
    { name: 'Tesco', colour: '#00539F' },
    { name: "Sainsbury's", colour: '#F06C00' },
    { name: 'Asda', colour: '#78BE20' },
    { name: 'Morrisons', colour: '#007A3D' },
    { name: 'Aldi', colour: '#00205B' },
    { name: 'Lidl', colour: '#0050AA' },
    { name: 'Waitrose', colour: '#5D8C51' },
    { name: 'Ocado', colour: '#6F2C91' },
    { name: 'Co-op', colour: '#00B1E7' },
    { name: 'M&S Food', colour: '#000000' },
];

export const PriceCompare = () => {
    const { t } = useTranslation();

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                {t('prices.title')}
            </Typography>

            <TextField
                fullWidth
                placeholder={t('prices.search')}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 3 }}
            />

            <Typography variant="h6" sx={{ mb: 2 }}>
                UK Supermarkets
            </Typography>
            <Grid container spacing={1} sx={{ mb: 4 }}>
                {UK_STORES.map((store) => (
                    <Grid key={store.name}>
                        <Chip
                            label={store.name}
                            sx={{
                                backgroundColor: `${store.colour}15`,
                                color: store.colour,
                                fontWeight: 600,
                                borderColor: store.colour,
                            }}
                            variant="outlined"
                        />
                    </Grid>
                ))}
            </Grid>

            <Card sx={{ textAlign: 'center', py: 8 }}>
                <CardContent>
                    <CompareArrows sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        Search for a product to compare prices across UK supermarkets
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};
