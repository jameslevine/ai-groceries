import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Button,
    Chip,
    IconButton,
    Alert,
    Skeleton,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions as MuiDialogActions,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    Search,
    Bookmark,
    BookmarkBorder,
    AccessTime,
    Restaurant,
    Close,
    OpenInNew,
} from '@mui/icons-material';
import {
    useDiscoverRecipes,
    useDiscoverCategories,
    useSaveDiscoveredRecipe,
} from '../hooks/useRecipes';
import type { DiscoveredRecipe } from '../hooks/useRecipes';

const DIFFICULTY_COLOURS: Record<string, string> = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
};

export const DiscoverRecipes = () => {
    const { t } = useTranslation();
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('');
    const [previewRecipe, setPreviewRecipe] = useState<DiscoveredRecipe | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [snackbar, setSnackbar] = useState<string | null>(null);

    const params = searchQuery
        ? { q: searchQuery }
        : selectedCategory
            ? { category: selectedCategory }
            : selectedCuisine
                ? { cuisine: selectedCuisine }
                : {};

    const { data: discoverData, isLoading, error } = useDiscoverRecipes(params);
    const { data: categoriesData } = useDiscoverCategories();
    const saveRecipe = useSaveDiscoveredRecipe();

    const recipes = discoverData?.items || [];
    const categories = categoriesData?.categories || [];
    const cuisines = categoriesData?.cuisines || [];

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput.length >= 2) {
                setSearchQuery(searchInput);
                setSelectedCategory('');
                setSelectedCuisine('');
            } else if (searchInput.length === 0) {
                setSearchQuery('');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const handleSave = async (recipe: DiscoveredRecipe) => {
        try {
            await saveRecipe.mutateAsync(recipe);
            setSavedIds((prev) => new Set([...prev, recipe.externalId]));
            setSnackbar(`"${recipe.name}" saved to your recipes!`);
        } catch {
            setSnackbar('Failed to save recipe. Please try again.');
        }
    };

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        setSelectedCuisine('');
        setSearchInput('');
        setSearchQuery('');
    };

    const handleCuisineClick = (cuisine: string) => {
        setSelectedCuisine(cuisine);
        setSelectedCategory('');
        setSearchInput('');
        setSearchQuery('');
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearchQuery('');
        setSelectedCategory('');
        setSelectedCuisine('');
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Discover Recipes
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Search thousands of recipes from around the world. Save your favourites to your collection.
                </Typography>
            </Box>

            {/* Search */}
            <TextField
                fullWidth
                placeholder="Search for recipes... (e.g. chicken, pasta, curry)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                    endAdornment: searchInput && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => { setSearchInput(''); setSearchQuery(''); }}>
                                <Close />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            {/* Category Chips */}
            {!searchQuery && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Browse by Category
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {categories.map((cat) => (
                            <Chip
                                key={cat}
                                label={cat}
                                onClick={() => handleCategoryClick(cat)}
                                color={selectedCategory === cat ? 'primary' : 'default'}
                                variant={selectedCategory === cat ? 'filled' : 'outlined'}
                                size="small"
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Cuisine Chips */}
            {!searchQuery && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Browse by Cuisine
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {cuisines.map((cuisine) => (
                            <Chip
                                key={cuisine}
                                label={cuisine}
                                onClick={() => handleCuisineClick(cuisine)}
                                color={selectedCuisine === cuisine ? 'secondary' : 'default'}
                                variant={selectedCuisine === cuisine ? 'filled' : 'outlined'}
                                size="small"
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Active filter indicator */}
            {(searchQuery || selectedCategory || selectedCuisine) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        {searchQuery && `Searching: "${searchQuery}"`}
                        {selectedCategory && `Category: ${selectedCategory}`}
                        {selectedCuisine && `Cuisine: ${selectedCuisine}`}
                    </Typography>
                    <Button size="small" onClick={clearFilters}>
                        Clear
                    </Button>
                </Box>
            )}

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to search recipes. Please try again.
                </Alert>
            )}

            {/* Loading */}
            {isLoading && (
                <Grid container spacing={2}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card>
                                <Skeleton variant="rectangular" height={180} />
                                <CardContent>
                                    <Skeleton variant="text" width="80%" height={28} />
                                    <Skeleton variant="text" width="60%" />
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                        <Skeleton variant="rounded" width={60} height={24} />
                                        <Skeleton variant="rounded" width={60} height={24} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Results */}
            {!isLoading && recipes.length > 0 && (
                <Grid container spacing={2}>
                    {recipes.map((recipe: DiscoveredRecipe) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe.externalId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                    },
                                }}
                            >
                                {recipe.imageUrl && (
                                    <CardMedia
                                        component="img"
                                        height="180"
                                        image={recipe.imageUrl}
                                        alt={recipe.name}
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => setPreviewRecipe(recipe)}
                                    />
                                )}
                                <CardContent
                                    sx={{ flex: 1, cursor: 'pointer' }}
                                    onClick={() => setPreviewRecipe(recipe)}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1rem' }}>
                                        {recipe.name}
                                    </Typography>
                                    {recipe.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {recipe.description}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {recipe.totalTime} min
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Restaurant sx={{ fontSize: 14, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {recipe.servings} servings
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {recipe.cuisine && (
                                            <Chip label={recipe.cuisine} size="small" variant="outlined" />
                                        )}
                                        {recipe.tags?.slice(0, 2).map((tag) => (
                                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        variant={savedIds.has(recipe.externalId) ? 'contained' : 'outlined'}
                                        startIcon={savedIds.has(recipe.externalId) ? <Bookmark /> : <BookmarkBorder />}
                                        onClick={() => handleSave(recipe)}
                                        disabled={savedIds.has(recipe.externalId) || saveRecipe.isPending}
                                        fullWidth
                                    >
                                        {savedIds.has(recipe.externalId) ? 'Saved' : 'Save to My Recipes'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Empty state */}
            {!isLoading && recipes.length === 0 && !error && (
                <Card sx={{ textAlign: 'center', py: 6 }}>
                    <CardContent>
                        <Search sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary">
                            {searchQuery
                                ? `No recipes found for "${searchQuery}"`
                                : 'Search for recipes or browse by category'}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Recipe Preview Dialog */}
            <Dialog
                open={!!previewRecipe}
                onClose={() => setPreviewRecipe(null)}
                maxWidth="md"
                fullWidth
            >
                {previewRecipe && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                    {previewRecipe.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {previewRecipe.description}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setPreviewRecipe(null)}>
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent>
                            {previewRecipe.imageUrl && (
                                <Box
                                    component="img"
                                    src={previewRecipe.imageUrl}
                                    alt={previewRecipe.name}
                                    sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 2, mb: 2 }}
                                />
                            )}

                            {/* Meta */}
                            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Chip icon={<AccessTime />} label={`${previewRecipe.totalTime} min`} />
                                <Chip icon={<Restaurant />} label={`${previewRecipe.servings} servings`} />
                                {previewRecipe.cuisine && <Chip label={previewRecipe.cuisine} variant="outlined" />}
                                {previewRecipe.difficulty && (
                                    <Chip
                                        label={previewRecipe.difficulty}
                                        sx={{
                                            backgroundColor: `${DIFFICULTY_COLOURS[previewRecipe.difficulty] || '#999'}20`,
                                            color: DIFFICULTY_COLOURS[previewRecipe.difficulty] || '#999',
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                        }}
                                    />
                                )}
                            </Box>

                            <Grid container spacing={3}>
                                {/* Ingredients */}
                                <Grid size={{ xs: 12, md: 5 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {t('recipes.ingredients')} ({previewRecipe.ingredients.length})
                                    </Typography>
                                    <List dense disablePadding>
                                        {previewRecipe.ingredients.map((ing, i) => (
                                            <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                                                <ListItemText
                                                    primary={`${ing.quantity} ${ing.unit} ${ing.name}`.trim()}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>

                                {/* Directions */}
                                <Grid size={{ xs: 12, md: 7 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {t('recipes.directions')}
                                    </Typography>
                                    {previewRecipe.directions.map((step, i) => (
                                        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                                            <Box
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    flexShrink: 0,
                                                    mt: 0.25,
                                                }}
                                            >
                                                {i + 1}
                                            </Box>
                                            <Typography variant="body2">{step.instruction}</Typography>
                                        </Box>
                                    ))}
                                </Grid>
                            </Grid>

                            {previewRecipe.sourceUrl && (
                                <Box sx={{ mt: 2 }}>
                                    <Button
                                        size="small"
                                        startIcon={<OpenInNew />}
                                        href={previewRecipe.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View Original Source
                                    </Button>
                                </Box>
                            )}
                        </DialogContent>
                        <MuiDialogActions sx={{ px: 3, pb: 2 }}>
                            <Button onClick={() => setPreviewRecipe(null)}>
                                {t('common.close')}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={savedIds.has(previewRecipe.externalId) ? <Bookmark /> : <BookmarkBorder />}
                                onClick={() => {
                                    handleSave(previewRecipe);
                                    setPreviewRecipe(null);
                                }}
                                disabled={savedIds.has(previewRecipe.externalId)}
                            >
                                {savedIds.has(previewRecipe.externalId) ? 'Already Saved' : 'Save to My Recipes'}
                            </Button>
                        </MuiDialogActions>
                    </>
                )}
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={!!snackbar}
                autoHideDuration={3000}
                onClose={() => setSnackbar(null)}
                message={snackbar}
            />
        </Box>
    );
};
