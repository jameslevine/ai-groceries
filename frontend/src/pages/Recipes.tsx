import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    TextField,
    InputAdornment,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    CircularProgress,
    Alert,
    Rating,
    Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    Add,
    Search,
    MenuBook,
    AccessTime,
    Restaurant,
    Delete,
    Edit,
    Link as LinkIcon,
    Close,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRecipes, useCreateRecipe, useDeleteRecipe, useImportRecipeFromUrl } from '../hooks/useRecipes';

const DIFFICULTY_COLOURS: Record<string, string> = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
};

const CUISINE_OPTIONS = [
    'British', 'Italian', 'Indian', 'Chinese', 'Mexican', 'Thai',
    'Japanese', 'French', 'Mediterranean', 'American', 'Other',
];

const createRecipeSchema = Yup.object({
    name: Yup.string().min(2, 'Name must be at least 2 characters').required('Recipe name is required'),
    description: Yup.string().max(500).optional(),
    prepTime: Yup.number().min(0).required('Prep time is required'),
    cookTime: Yup.number().min(0).required('Cook time is required'),
    servings: Yup.number().min(1).required('Servings is required'),
    difficulty: Yup.string().oneOf(['easy', 'medium', 'hard']).required('Difficulty is required'),
    cuisine: Yup.string().optional(),
    tags: Yup.string().optional(),
});

interface RecipeIngredient {
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    isOptional: boolean;
}

interface Recipe {
    recipeId: string;
    userId: string;
    name: string;
    description: string;
    ingredients: RecipeIngredient[];
    directions: { stepNumber: number; instruction: string; duration?: number }[];
    prepTime: number;
    cookTime: number;
    totalTime: number;
    servings: number;
    rating: number;
    ratingCount: number;
    imageUrl?: string;
    tags: string[];
    cuisine?: string;
    difficulty: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export const Recipes = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { data: recipesData, isLoading, error } = useRecipes();
    const createRecipe = useCreateRecipe();
    const deleteRecipe = useDeleteRecipe();
    const importRecipe = useImportRecipeFromUrl();

    const recipes = (recipesData as { items?: Recipe[] })?.items || (Array.isArray(recipesData) ? recipesData as Recipe[] : []);

    const filteredRecipes = searchQuery
        ? recipes.filter((r: Recipe) =>
            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
            r.cuisine?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : recipes;

    const formik = useFormik({
        initialValues: {
            name: '',
            description: '',
            prepTime: 15,
            cookTime: 30,
            servings: 4,
            difficulty: 'medium',
            cuisine: '',
            tags: '',
        },
        validationSchema: createRecipeSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                await createRecipe.mutateAsync({
                    name: values.name,
                    description: values.description,
                    prepTime: values.prepTime,
                    cookTime: values.cookTime,
                    totalTime: values.prepTime + values.cookTime,
                    servings: values.servings,
                    difficulty: values.difficulty,
                    cuisine: values.cuisine || undefined,
                    tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
                    ingredients: [],
                    directions: [],
                    isPublic: false,
                });
                resetForm();
                setCreateDialogOpen(false);
            } catch {
                // Error handled by mutation
            }
        },
    });

    const handleDelete = async (recipeId: string) => {
        try {
            await deleteRecipe.mutateAsync(recipeId);
            setDeleteConfirmId(null);
        } catch {
            // Error handled by mutation
        }
    };

    const handleImport = async () => {
        if (!importUrl) return;
        try {
            await importRecipe.mutateAsync(importUrl);
            setImportUrl('');
            setImportDialogOpen(false);
        } catch {
            // Error handled by mutation
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {t('recipes.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<LinkIcon />}
                        onClick={() => setImportDialogOpen(true)}
                    >
                        {t('recipes.importUrl')}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        {t('recipes.createNew')}
                    </Button>
                </Box>
            </Box>

            {/* Search */}
            <TextField
                fullWidth
                placeholder={t('recipes.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 3 }}
            />

            {/* Error */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load recipes. Please try again.
                </Alert>
            )}

            {/* Loading */}
            {isLoading && (
                <Grid container spacing={2}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                            <Card>
                                <CardContent>
                                    <Skeleton variant="text" width="80%" height={32} />
                                    <Skeleton variant="text" width="60%" />
                                    <Skeleton variant="text" width="40%" />
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

            {/* Empty State */}
            {!isLoading && filteredRecipes.length === 0 && (
                <Card sx={{ textAlign: 'center', py: 8 }}>
                    <CardContent>
                        <MenuBook sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            {searchQuery ? t('common.noResults') : t('recipes.emptyState')}
                        </Typography>
                        {!searchQuery && (
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={() => setCreateDialogOpen(true)}
                                sx={{ mt: 1 }}
                            >
                                {t('recipes.createNew')}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recipe Cards */}
            {!isLoading && filteredRecipes.length > 0 && (
                <Grid container spacing={2}>
                    {filteredRecipes.map((recipe: Recipe) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={recipe.recipeId}>
                            <Card
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                    },
                                }}
                                onClick={() => navigate(`/recipes/${recipe.recipeId}`)}
                            >
                                <CardContent sx={{ flex: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        {recipe.name}
                                    </Typography>
                                    {recipe.description && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                mb: 1.5,
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

                                    {/* Meta info */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {recipe.totalTime || (recipe.prepTime + recipe.cookTime)} min
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Restaurant sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">
                                                {recipe.servings} servings
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Rating */}
                                    {recipe.rating > 0 && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                            <Rating value={recipe.rating} precision={0.5} size="small" readOnly />
                                            <Typography variant="caption" color="text.secondary">
                                                ({recipe.ratingCount})
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Tags */}
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {recipe.difficulty && (
                                            <Chip
                                                label={t(`recipes.difficulty.${recipe.difficulty}`)}
                                                size="small"
                                                sx={{
                                                    backgroundColor: `${DIFFICULTY_COLOURS[recipe.difficulty] || '#999'}20`,
                                                    color: DIFFICULTY_COLOURS[recipe.difficulty] || '#999',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        )}
                                        {recipe.cuisine && (
                                            <Chip label={recipe.cuisine} size="small" variant="outlined" />
                                        )}
                                        {recipe.tags?.slice(0, 2).map((tag: string) => (
                                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                                        ))}
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/recipes/${recipe.recipeId}`);
                                        }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirmId(recipe.recipeId);
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Create Recipe Dialog */}
            <Dialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t('recipes.createNew')}
                    <IconButton onClick={() => setCreateDialogOpen(false)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={formik.handleSubmit}>
                    <DialogContent>
                        <TextField
                            fullWidth
                            id="name"
                            name="name"
                            label="Recipe Name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            fullWidth
                            id="description"
                            name="description"
                            label="Description"
                            multiline
                            rows={2}
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.description && Boolean(formik.errors.description)}
                            helperText={formik.touched.description && formik.errors.description}
                            sx={{ mb: 2 }}
                        />
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                id="prepTime"
                                name="prepTime"
                                label={t('recipes.prepTime')}
                                type="number"
                                value={formik.values.prepTime}
                                onChange={formik.handleChange}
                                inputProps={{ min: 0 }}
                            />
                            <TextField
                                fullWidth
                                id="cookTime"
                                name="cookTime"
                                label={t('recipes.cookTime')}
                                type="number"
                                value={formik.values.cookTime}
                                onChange={formik.handleChange}
                                inputProps={{ min: 0 }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                fullWidth
                                id="servings"
                                name="servings"
                                label={t('recipes.servings')}
                                type="number"
                                value={formik.values.servings}
                                onChange={formik.handleChange}
                                inputProps={{ min: 1 }}
                            />
                            <TextField
                                fullWidth
                                id="difficulty"
                                name="difficulty"
                                label="Difficulty"
                                select
                                value={formik.values.difficulty}
                                onChange={formik.handleChange}
                                SelectProps={{ native: true }}
                            >
                                <option value="easy">{t('recipes.difficulty.easy')}</option>
                                <option value="medium">{t('recipes.difficulty.medium')}</option>
                                <option value="hard">{t('recipes.difficulty.hard')}</option>
                            </TextField>
                        </Box>
                        <TextField
                            fullWidth
                            id="cuisine"
                            name="cuisine"
                            label="Cuisine"
                            select
                            value={formik.values.cuisine}
                            onChange={formik.handleChange}
                            SelectProps={{ native: true }}
                            sx={{ mb: 2 }}
                        >
                            <option value="">Select cuisine...</option>
                            {CUISINE_OPTIONS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </TextField>
                        <TextField
                            fullWidth
                            id="tags"
                            name="tags"
                            label="Tags (comma separated)"
                            placeholder="e.g. quick, healthy, family"
                            value={formik.values.tags}
                            onChange={formik.handleChange}
                        />

                        {createRecipe.isError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Failed to create recipe. Please try again.
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setCreateDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={createRecipe.isPending}
                        >
                            {createRecipe.isPending ? <CircularProgress size={20} /> : t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Import URL Dialog */}
            <Dialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{t('recipes.importUrl')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Paste a recipe URL and we&apos;ll try to import the ingredients and instructions.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Recipe URL"
                        placeholder="https://www.bbcgoodfood.com/recipes/..."
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LinkIcon />
                                </InputAdornment>
                            ),
                        }}
                    />
                    {importRecipe.isError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Failed to import recipe. This feature is coming soon.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportDialogOpen(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleImport}
                        disabled={!importUrl || importRecipe.isPending}
                    >
                        {importRecipe.isPending ? <CircularProgress size={20} /> : 'Import'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
            >
                <DialogTitle>{t('common.confirm')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this recipe? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmId(null)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                        disabled={deleteRecipe.isPending}
                    >
                        {deleteRecipe.isPending ? <CircularProgress size={20} /> : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
