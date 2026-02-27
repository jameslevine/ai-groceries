import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    Add,
    ChevronLeft,
    ChevronRight,
    CalendarMonth,
    Delete,
    ShoppingCart,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { useMeals, useCreateMeal, useDeleteMeal, useGenerateListFromMeals } from '../hooks/useMeals';
import { useRecipes } from '../hooks/useRecipes';

const MEAL_TYPES = ['breakfast', 'lunch', 'snack', 'dinner', 'dessert'] as const;

const MEAL_TYPE_COLOURS: Record<string, string> = {
    breakfast: '#FF9800',
    lunch: '#4CAF50',
    snack: '#9C27B0',
    dinner: '#2196F3',
    dessert: '#E91E63',
};

interface MealPlan {
    mealId: string;
    date: string;
    mealType: string;
    recipeId?: string;
    recipeName?: string;
    notes?: string;
    servings: number;
}

interface Recipe {
    recipeId: string;
    name: string;
    prepTime: number;
    cookTime: number;
    servings: number;
}

export const MealPlanner = () => {
    const { t } = useTranslation();
    const [weekOffset, setWeekOffset] = useState(0);
    const [addMealOpen, setAddMealOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedMealType, setSelectedMealType] = useState<string>('dinner');
    const [mealName, setMealName] = useState('');
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [mealNotes, setMealNotes] = useState('');
    const [generateListOpen, setGenerateListOpen] = useState(false);

    // Calculate week dates
    const weekDates = useMemo(() => {
        const startOfWeek = dayjs().startOf('week').add(weekOffset * 7, 'day');
        return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    }, [weekOffset]);

    const startDate = weekDates[0].format('YYYY-MM-DD');
    const endDate = weekDates[6].format('YYYY-MM-DD');

    const { data: mealsData, isLoading } = useMeals(startDate, endDate);
    const { data: recipesData } = useRecipes();
    const createMeal = useCreateMeal();
    const deleteMeal = useDeleteMeal();
    const generateList = useGenerateListFromMeals();

    const meals = (mealsData as { items?: MealPlan[] })?.items || [];
    const recipes = ((recipesData as { items?: Recipe[] })?.items || (Array.isArray(recipesData) ? recipesData as Recipe[] : []));

    const getMealsForDay = (date: string) => {
        return meals.filter((m: MealPlan) => m.date === date);
    };

    const handleAddMeal = async () => {
        if (!selectedDate || !selectedMealType) return;
        const selectedRecipe = recipes.find((r: Recipe) => r.recipeId === selectedRecipeId);
        try {
            await createMeal.mutateAsync({
                date: selectedDate,
                mealType: selectedMealType,
                recipeId: selectedRecipeId || undefined,
                recipeName: selectedRecipe?.name || mealName || undefined,
                notes: mealNotes || undefined,
                servings: selectedRecipe?.servings || 4,
            });
            setAddMealOpen(false);
            setMealName('');
            setSelectedRecipeId('');
            setMealNotes('');
        } catch {
            // Error handled by mutation
        }
    };

    const handleDeleteMeal = async (meal: MealPlan) => {
        try {
            await deleteMeal.mutateAsync({
                mealId: meal.mealId,
                date: meal.date,
                mealType: meal.mealType,
            });
        } catch {
            // Error handled by mutation
        }
    };

    const handleGenerateList = async () => {
        try {
            await generateList.mutateAsync({
                startDate,
                endDate,
                deductInventory: true,
                listName: `Week of ${weekDates[0].format('D MMM')}`,
            });
            setGenerateListOpen(false);
        } catch {
            // Error handled by mutation
        }
    };

    const openAddMeal = (date: string, mealType: string) => {
        setSelectedDate(date);
        setSelectedMealType(mealType);
        setAddMealOpen(true);
    };

    const isToday = (date: dayjs.Dayjs) => date.isSame(dayjs(), 'day');

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {t('meals.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ShoppingCart />}
                        onClick={() => setGenerateListOpen(true)}
                        disabled={meals.length === 0}
                    >
                        Generate Shopping List
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedDate(dayjs().format('YYYY-MM-DD'));
                            setSelectedMealType('dinner');
                            setAddMealOpen(true);
                        }}
                    >
                        {t('meals.addMeal')}
                    </Button>
                </Box>
            </Box>

            {/* Week Navigation */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => setWeekOffset((w) => w - 1)}>
                    <ChevronLeft />
                </IconButton>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {weekDates[0].format('D MMM')} — {weekDates[6].format('D MMM YYYY')}
                    </Typography>
                    {weekOffset !== 0 && (
                        <Button size="small" onClick={() => setWeekOffset(0)}>
                            {t('meals.today')}
                        </Button>
                    )}
                </Box>
                <IconButton onClick={() => setWeekOffset((w) => w + 1)}>
                    <ChevronRight />
                </IconButton>
            </Box>

            {/* Loading */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Weekly Calendar Grid */}
            {!isLoading && (
                <Grid container spacing={1}>
                    {weekDates.map((date) => {
                        const dateStr = date.format('YYYY-MM-DD');
                        const dayMeals = getMealsForDay(dateStr);
                        const today = isToday(date);

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 12 / 7 }} key={dateStr}>
                                <Card
                                    sx={{
                                        minHeight: 200,
                                        border: today ? '2px solid' : '1px solid',
                                        borderColor: today ? 'primary.main' : 'divider',
                                        backgroundColor: today ? 'primary.main' + '08' : undefined,
                                    }}
                                >
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        {/* Day Header */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Box>
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: today ? 'primary.main' : 'text.secondary',
                                                        textTransform: 'uppercase',
                                                    }}
                                                >
                                                    {date.format('ddd')}
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 700,
                                                        lineHeight: 1,
                                                        color: today ? 'primary.main' : 'text.primary',
                                                    }}
                                                >
                                                    {date.format('D')}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => openAddMeal(dateStr, 'dinner')}
                                            >
                                                <Add fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        {/* Meals for this day */}
                                        {dayMeals.length === 0 ? (
                                            <Typography
                                                variant="caption"
                                                color="text.disabled"
                                                sx={{ display: 'block', textAlign: 'center', py: 2 }}
                                            >
                                                No meals
                                            </Typography>
                                        ) : (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {dayMeals.map((meal: MealPlan) => (
                                                    <Box
                                                        key={meal.mealId}
                                                        sx={{
                                                            p: 0.75,
                                                            borderRadius: 1,
                                                            backgroundColor: `${MEAL_TYPE_COLOURS[meal.mealType] || '#999'}15`,
                                                            borderLeft: `3px solid ${MEAL_TYPE_COLOURS[meal.mealType] || '#999'}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                        }}
                                                    >
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    fontWeight: 600,
                                                                    color: MEAL_TYPE_COLOURS[meal.mealType] || '#999',
                                                                    textTransform: 'capitalize',
                                                                    display: 'block',
                                                                    fontSize: '0.65rem',
                                                                }}
                                                            >
                                                                {meal.mealType}
                                                            </Typography>
                                                            <Typography
                                                                variant="body2"
                                                                sx={{
                                                                    fontSize: '0.75rem',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {meal.recipeName || meal.notes || 'Meal'}
                                                            </Typography>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteMeal(meal)}
                                                            sx={{ p: 0.25 }}
                                                        >
                                                            <Delete sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Box>
                                                ))}
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Empty state when no meals at all */}
            {!isLoading && meals.length === 0 && (
                <Card sx={{ textAlign: 'center', py: 4, mt: 2 }}>
                    <CardContent>
                        <CalendarMonth sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            {t('meals.emptyState')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Click the + button on any day to start planning your meals.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {/* Add Meal Dialog */}
            <Dialog open={addMealOpen} onClose={() => setAddMealOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('meals.addMeal')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {selectedDate && dayjs(selectedDate).format('dddd, D MMMM YYYY')}
                    </Typography>

                    {/* Meal Type */}
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Meal Type</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {MEAL_TYPES.map((type) => (
                            <Chip
                                key={type}
                                label={t(`meals.${type}`)}
                                onClick={() => setSelectedMealType(type)}
                                color={selectedMealType === type ? 'primary' : 'default'}
                                variant={selectedMealType === type ? 'filled' : 'outlined'}
                                sx={{ textTransform: 'capitalize' }}
                            />
                        ))}
                    </Box>

                    {/* Recipe Selection */}
                    <TextField
                        fullWidth
                        label="Select Recipe (optional)"
                        select
                        value={selectedRecipeId}
                        onChange={(e) => setSelectedRecipeId(e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{ mb: 2 }}
                    >
                        <option value="">No recipe - custom meal</option>
                        {recipes.map((recipe: Recipe) => (
                            <option key={recipe.recipeId} value={recipe.recipeId}>
                                {recipe.name}
                            </option>
                        ))}
                    </TextField>

                    {/* Custom meal name (if no recipe selected) */}
                    {!selectedRecipeId && (
                        <TextField
                            fullWidth
                            label="Meal Name"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            placeholder="e.g. Leftover pasta"
                            sx={{ mb: 2 }}
                        />
                    )}

                    <TextField
                        fullWidth
                        label="Notes (optional)"
                        value={mealNotes}
                        onChange={(e) => setMealNotes(e.target.value)}
                        multiline
                        rows={2}
                    />

                    {createMeal.isError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Failed to add meal. Please try again.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddMealOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddMeal}
                        disabled={createMeal.isPending || (!selectedRecipeId && !mealName)}
                    >
                        {createMeal.isPending ? <CircularProgress size={20} /> : t('common.add')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Generate Shopping List Dialog */}
            <Dialog open={generateListOpen} onClose={() => setGenerateListOpen(false)}>
                <DialogTitle>Generate Shopping List</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Generate a shopping list from all meals planned for:
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {weekDates[0].format('D MMM')} — {weekDates[6].format('D MMM YYYY')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Items already in your inventory will be deducted automatically.
                    </Typography>
                    {generateList.isError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Failed to generate list. Please try again.
                        </Alert>
                    )}
                    {generateList.isSuccess && (
                        <Alert severity="success" sx={{ mt: 2 }}>
                            Shopping list generated successfully!
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGenerateListOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleGenerateList}
                        disabled={generateList.isPending}
                        startIcon={<ShoppingCart />}
                    >
                        {generateList.isPending ? <CircularProgress size={20} /> : 'Generate'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
