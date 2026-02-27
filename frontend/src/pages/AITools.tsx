import { useTranslation } from 'react-i18next';
import { Box, Typography, Card, CardActionArea } from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    CameraAlt,
    Receipt,
    Restaurant,
    FoodBank,
    Category,
    AutoAwesome,
} from '@mui/icons-material';

const aiFeatures = [
    {
        title: 'Photo → Recipe',
        description: 'Snap a photo of any dish and get its full recipe with ingredients, directions & nutrition.',
        icon: <CameraAlt sx={{ fontSize: 48 }} />,
        colour: '#E91E63',
    },
    {
        title: 'Photo → Shopping List',
        description: 'Take a photo of items at home and AI will generate a shopping list for you.',
        icon: <FoodBank sx={{ fontSize: 48 }} />,
        colour: '#2196F3',
    },
    {
        title: 'Scan Receipt',
        description: 'Snap a photo of a receipt and import items into your shopping list or inventory.',
        icon: <Receipt sx={{ fontSize: 48 }} />,
        colour: '#4CAF50',
    },
    {
        title: 'Photo → Nutrition',
        description: 'Take a photo of any food item and know its exact nutrition value.',
        icon: <Restaurant sx={{ fontSize: 48 }} />,
        colour: '#FF9800',
    },
    {
        title: 'Generate Recipe',
        description: 'Enter ingredients or a recipe name to generate a full detailed recipe.',
        icon: <AutoAwesome sx={{ fontSize: 48 }} />,
        colour: '#9C27B0',
    },
    {
        title: 'Smart Categorise',
        description: 'AI instantly assigns categories and inventory locations for your items.',
        icon: <Category sx={{ fontSize: 48 }} />,
        colour: '#00BCD4',
    },
];

export const AITools = () => {
    const { t } = useTranslation();

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                {t('ai.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Powerful AI features meticulously crafted to simplify and enrich your grocery life.
            </Typography>

            <Grid container spacing={3}>
                {aiFeatures.map((feature) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
                        <Card
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                },
                            }}
                        >
                            <CardActionArea sx={{ height: '100%', p: 3 }}>
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 3,
                                        backgroundColor: `${feature.colour}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: feature.colour,
                                        mb: 2,
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    {feature.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {feature.description}
                                </Typography>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
