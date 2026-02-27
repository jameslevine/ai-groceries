import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    CircularProgress,
    Alert,
    Rating,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    ArrowBack,
    AccessTime,
    Restaurant,
    Delete,
    Add,
    CheckCircleOutline,
    RadioButtonUnchecked,
    ShoppingCart,
} from '@mui/icons-material';
import { useRecipe, useUpdateRecipe, useDeleteRecipe, useRateRecipe } from '../hooks/useRecipes';

const DIFFICULTY_COLOURS: Record<string, string> = {
    easy: '#4CAF50',
    medium: '#FF9800',
    hard: '#F44336',
};

interface Ingredient {
    ingredientId: string;
    name: string;
    quantity: number;
    unit: string;
    notes?: string;
    isOptional: boolean;
}

interface Direction {
    stepNumber: number;
    instruction: string;
    duration?: number;
}

export const RecipeDetail = () => {
    const { t } = useTranslation();
    const { recipeId } = useParams<{ recipeId: string }>();
    const navigate = useNavigate();

    const { data: recipe, isLoading, error } = useRecipe(recipeId || '');
    const updateRecipe = useUpdateRecipe(recipeId || '');
    const deleteRecipeMutation = useDeleteRecipe();
    const rateRecipe = useRateRecipe(recipeId || '');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addIngredientOpen, setAddIngredientOpen] = useState(false);
    const [addStepOpen, setAddStepOpen] = useState(false);
    const [newIngredient, setNewIngredient] = useState({ name: '', quantity: 1, unit: 'g' });
    const [newStep, setNewStep] = useState('');
    const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={48} />
            </Box>
        );
    }

    if (error || !recipe) {
        return (
            <Box>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/recipes')} sx={{ mb: 2 }}>
                    Back to Recipes
                </Button>
                <Alert severity="error">
                    Recipe not found or failed to load.
                </Alert>
            </Box>
        );
    }

    const typedRecipe = recipe as {
        recipeId: string;
        name: string;
        description: string;
        ingredients: Ingredient[];
        directions: Direction[];
        prepTime: number;
        cookTime: number;
        totalTime: number;
        servings: number;
        rating: number;
        ratingCount: number;
        tags: string[];
        cuisine?: string;
        difficulty: string;
        sourceUrl?: string;
        createdAt: string;
        updatedAt: string;
    };

    const toggleIngredient = (id: string) => {
        setCheckedIngredients((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleAddIngredient = async () => {
        if (!newIngredient.name) return;
        const currentIngredients = typedRecipe.ingredients || [];
        try {
            await updateRecipe.mutateAsync({
                ingredients: [
                    ...currentIngredients,
                    {
                        ingredientId: `ing-${Date.now()}`,
                        name: newIngredient.name,
                        quantity: newIngredient.quantity,
                        unit: newIngredient.unit,
                        isOptional: false,
                    },
                ],
            });
            setNewIngredient({ name: '', quantity: 1, unit: 'g' });
            setAddIngredientOpen(false);
        } catch {
            // Error handled by mutation
        }
    };

    const handleAddStep = async () => {
        if (!newStep) return;
        const currentDirections = typedRecipe.directions || [];
        try {
            await updateRecipe.mutateAsync({
                directions: [
                    ...currentDirections,
                    {
                        stepNumber: currentDirections.length + 1,
                        instruction: newStep,
                    },
                ],
            });
            setNewStep('');
            setAddStepOpen(false);
        } catch {
            // Error handled by mutation
        }
    };

    const handleDelete = async () => {
        try {
            await deleteRecipeMutation.mutateAsync(recipeId || '');
            navigate('/recipes');
        } catch {
            // Error handled by mutation
        }
    };

    const handleRate = async (newValue: number | null) => {
        if (newValue) {
            try {
                await rateRecipe.mutateAsync(newValue);
            } catch {
                // Error handled by mutation
            }
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <IconButton onClick={() => navigate('/recipes')}>
                    <ArrowBack />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {typedRecipe.name}
                    </Typography>
                    {typedRecipe.description && (
                        <Typography variant="body1" color="text.secondary">
                            {typedRecipe.description}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={() => setDeleteDialogOpen(true)} color="error">
                    <Delete />
                </IconButton>
            </Box>

            {/* Meta Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <AccessTime sx={{ color: 'primary.main', mb: 0.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {typedRecipe.prepTime} min
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('recipes.prepTime')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <AccessTime sx={{ color: 'secondary.main', mb: 0.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {typedRecipe.cookTime} min
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('recipes.cookTime')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Restaurant sx={{ color: 'info.main', mb: 0.5 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {typedRecipe.servings}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {t('recipes.servings')}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Rating
                                value={typedRecipe.rating || 0}
                                precision={0.5}
                                size="small"
                                onChange={(_, newValue) => handleRate(newValue)}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {typedRecipe.ratingCount > 0 ? `${typedRecipe.ratingCount} ratings` : 'Rate this recipe'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tags */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {typedRecipe.difficulty && (
                    <Chip
                        label={t(`recipes.difficulty.${typedRecipe.difficulty}`)}
                        sx={{
                            backgroundColor: `${DIFFICULTY_COLOURS[typedRecipe.difficulty] || '#999'}20`,
                            color: DIFFICULTY_COLOURS[typedRecipe.difficulty] || '#999',
                            fontWeight: 600,
                        }}
                    />
                )}
                {typedRecipe.cuisine && <Chip label={typedRecipe.cuisine} variant="outlined" />}
                {typedRecipe.tags?.map((tag: string) => (
                    <Chip key={tag} label={tag} variant="outlined" size="small" />
                ))}
            </Box>

            <Grid container spacing={3}>
                {/* Ingredients */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {t('recipes.ingredients')}
                                </Typography>
                                <IconButton size="small" onClick={() => setAddIngredientOpen(true)}>
                                    <Add />
                                </IconButton>
                            </Box>

                            {(!typedRecipe.ingredients || typedRecipe.ingredients.length === 0) ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                    No ingredients added yet. Click + to add.
                                </Typography>
                            ) : (
                                <List dense disablePadding>
                                    {typedRecipe.ingredients.map((ing: Ingredient) => (
                                        <ListItem
                                            key={ing.ingredientId}
                                            disablePadding
                                            sx={{ py: 0.5, cursor: 'pointer' }}
                                            onClick={() => toggleIngredient(ing.ingredientId)}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                {checkedIngredients.has(ing.ingredientId) ? (
                                                    <CheckCircleOutline color="success" fontSize="small" />
                                                ) : (
                                                    <RadioButtonUnchecked fontSize="small" />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            textDecoration: checkedIngredients.has(ing.ingredientId) ? 'line-through' : 'none',
                                                            color: checkedIngredients.has(ing.ingredientId) ? 'text.disabled' : 'text.primary',
                                                        }}
                                                    >
                                                        {ing.quantity} {ing.unit} {ing.name}
                                                        {ing.isOptional && ' (optional)'}
                                                    </Typography>
                                                }
                                                secondary={ing.notes}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}

                            <Divider sx={{ my: 2 }} />
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<ShoppingCart />}
                                size="small"
                            >
                                Add to Shopping List
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Directions */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {t('recipes.directions')}
                                </Typography>
                                <IconButton size="small" onClick={() => setAddStepOpen(true)}>
                                    <Add />
                                </IconButton>
                            </Box>

                            {(!typedRecipe.directions || typedRecipe.directions.length === 0) ? (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                                    No directions added yet. Click + to add.
                                </Typography>
                            ) : (
                                <Box>
                                    {typedRecipe.directions.map((step: Direction, index: number) => (
                                        <Box key={step.stepNumber} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    backgroundColor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 700,
                                                    fontSize: '0.875rem',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body2">
                                                    {step.instruction}
                                                </Typography>
                                                {step.duration && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        ⏱ {step.duration} min
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Add Ingredient Dialog */}
            <Dialog open={addIngredientOpen} onClose={() => setAddIngredientOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add Ingredient</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Ingredient Name"
                        value={newIngredient.name}
                        onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                        sx={{ mb: 2, mt: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            label="Quantity"
                            type="number"
                            value={newIngredient.quantity}
                            onChange={(e) => setNewIngredient({ ...newIngredient, quantity: Number(e.target.value) })}
                            inputProps={{ min: 0, step: 0.1 }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            label="Unit"
                            select
                            value={newIngredient.unit}
                            onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                            SelectProps={{ native: true }}
                            sx={{ flex: 1 }}
                        >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="ml">ml</option>
                            <option value="l">l</option>
                            <option value="tsp">tsp</option>
                            <option value="tbsp">tbsp</option>
                            <option value="cup">cup</option>
                            <option value="piece">piece</option>
                            <option value="pinch">pinch</option>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddIngredientOpen(false)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={handleAddIngredient} disabled={!newIngredient.name}>
                        {t('common.add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Step Dialog */}
            <Dialog open={addStepOpen} onClose={() => setAddStepOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Step</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Instruction"
                        multiline
                        rows={3}
                        value={newStep}
                        onChange={(e) => setNewStep(e.target.value)}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddStepOpen(false)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={handleAddStep} disabled={!newStep}>
                        {t('common.add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>{t('common.confirm')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete &quot;{typedRecipe.name}&quot;? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDelete}
                        disabled={deleteRecipeMutation.isPending}
                    >
                        {deleteRecipeMutation.isPending ? <CircularProgress size={20} /> : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
