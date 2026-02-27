import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    ShoppingCart,
    Kitchen,
    MenuBook,
    CalendarMonth,
    TrendingDown,
    AutoAwesome,
} from '@mui/icons-material';
import { useStore } from '../store';
import { useShoppingLists } from '../hooks/useLists';
import { useRecipes } from '../hooks/useRecipes';
import { ROUTES } from '../constants/routes';

const quickActions = [
    {
        title: 'Shopping Lists',
        description: 'Create and manage your grocery lists',
        icon: <ShoppingCart sx={{ fontSize: 40 }} />,
        path: ROUTES.LISTS,
        colour: '#2E7D32',
    },
    {
        title: 'Home Inventory',
        description: 'Track what you have at home',
        icon: <Kitchen sx={{ fontSize: 40 }} />,
        path: ROUTES.INVENTORY,
        colour: '#1565C0',
    },
    {
        title: 'Recipes',
        description: 'Discover and save recipes',
        icon: <MenuBook sx={{ fontSize: 40 }} />,
        path: ROUTES.RECIPES,
        colour: '#E65100',
    },
    {
        title: 'Meal Planner',
        description: 'Plan your weekly meals',
        icon: <CalendarMonth sx={{ fontSize: 40 }} />,
        path: ROUTES.MEAL_PLANNER,
        colour: '#6A1B9A',
    },
    {
        title: 'Price Compare',
        description: 'Find the best deals across UK supermarkets',
        icon: <TrendingDown sx={{ fontSize: 40 }} />,
        path: ROUTES.PRICES,
        colour: '#00695C',
    },
    {
        title: 'AI Tools',
        description: 'Smart photo scanning, recipe generation & more',
        icon: <AutoAwesome sx={{ fontSize: 40 }} />,
        path: ROUTES.AI_TOOLS,
        colour: '#AD1457',
    },
];

interface ShoppingList {
    listId: string;
    items: { isChecked: boolean }[];
}

interface Recipe {
    recipeId: string;
}

export const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const user = useStore((state) => state.user);

    const { data: listsData, isLoading: listsLoading } = useShoppingLists();
    const { data: recipesData, isLoading: recipesLoading } = useRecipes();

    const lists = ((listsData as { items?: ShoppingList[] })?.items || (Array.isArray(listsData) ? listsData as ShoppingList[] : []));
    const recipes = ((recipesData as { items?: Recipe[] })?.items || (Array.isArray(recipesData) ? recipesData as Recipe[] : []));

    const activeLists = lists.length;
    const totalListItems = lists.reduce((sum: number, l: ShoppingList) => sum + (l.items?.length || 0), 0);
    const savedRecipes = recipes.length;

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    {greeting()}{user?.firstName ? `, ${user.firstName}` : ''} 🛒
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {t('app.tagline')}
                </Typography>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            {listsLoading ? (
                                <CircularProgress size={32} />
                            ) : (
                                <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                                    {activeLists}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                Active Lists
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            {listsLoading ? (
                                <CircularProgress size={32} />
                            ) : (
                                <Typography variant="h3" color="info.main" sx={{ fontWeight: 700 }}>
                                    {totalListItems}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                List Items
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            {recipesLoading ? (
                                <CircularProgress size={32} />
                            ) : (
                                <Typography variant="h3" color="secondary" sx={{ fontWeight: 700 }}>
                                    {savedRecipes}
                                </Typography>
                            )}
                            <Typography variant="body2" color="text.secondary">
                                Saved Recipes
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h3" color="warning.main" sx={{ fontWeight: 700 }}>
                                10
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <Chip label="UK Stores" size="small" color="success" />
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
            </Typography>
            <Grid container spacing={2}>
                {quickActions.map((action) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.path}>
                        <Card
                            sx={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                },
                            }}
                            onClick={() => navigate(action.path)}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: 3,
                                        backgroundColor: `${action.colour}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: action.colour,
                                        mb: 2,
                                    }}
                                >
                                    {action.icon}
                                </Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {action.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {action.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
