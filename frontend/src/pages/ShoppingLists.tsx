import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    CardActions,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    LinearProgress,
    InputAdornment,
    Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
    Add,
    Delete,
    Star,
    StarBorder,
    ShoppingCart,
} from '@mui/icons-material';
import {
    useShoppingLists,
    useShoppingList,
    useCreateList,
    useUpdateList,
    useDeleteList,
    useAddListItem,
    useUpdateListItem,
    useDeleteListItem,
} from '../hooks/useLists';

interface ShoppingListItem {
    itemId: string;
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    isChecked: boolean;
    price?: number;
    store?: string;
    notes?: string;
}

interface ShoppingList {
    listId: string;
    name: string;
    items: ShoppingListItem[];
    isFavourite: boolean;
    createdAt: string;
    updatedAt: string;
}

export const ShoppingLists = () => {
    const { t } = useTranslation();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [selectedListId, setSelectedListId] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState(1);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const { data: listsData, isLoading } = useShoppingLists();
    const { data: selectedList } = useShoppingList(selectedListId || '');
    const createList = useCreateList();
    const deleteList = useDeleteList();
    const updateList = useUpdateList(selectedListId || '');
    const addItem = useAddListItem(selectedListId || '');
    const updateItem = useUpdateListItem(selectedListId || '');
    const deleteItem = useDeleteListItem(selectedListId || '');

    const lists = ((listsData as { items?: ShoppingList[] })?.items || (Array.isArray(listsData) ? listsData as ShoppingList[] : []));
    const activeList = selectedList as ShoppingList | undefined;
    const items = activeList?.items || [];
    const checkedCount = items.filter((i: ShoppingListItem) => i.isChecked).length;
    const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;

    const handleCreateList = async () => {
        if (!newListName.trim()) return;
        try {
            const result = await createList.mutateAsync({ name: newListName.trim() });
            setNewListName('');
            setCreateDialogOpen(false);
            if ((result as ShoppingList)?.listId) {
                setSelectedListId((result as ShoppingList).listId);
            }
        } catch {
            // Error handled by mutation
        }
    };

    const handleDeleteList = async (listId: string) => {
        try {
            await deleteList.mutateAsync(listId);
            if (selectedListId === listId) {
                setSelectedListId(null);
            }
            setDeleteConfirmId(null);
        } catch {
            // Error handled by mutation
        }
    };

    const handleToggleFavourite = async () => {
        if (!activeList) return;
        try {
            await updateList.mutateAsync({ isFavourite: !activeList.isFavourite });
        } catch {
            // Error handled by mutation
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim() || !selectedListId) return;
        try {
            await addItem.mutateAsync({
                name: newItemName.trim(),
                quantity: newItemQuantity,
                unit: 'piece',
                isChecked: false,
            });
            setNewItemName('');
            setNewItemQuantity(1);
        } catch {
            // Error handled by mutation
        }
    };

    const handleToggleItem = async (item: ShoppingListItem) => {
        try {
            await updateItem.mutateAsync({
                itemId: item.itemId,
                data: { isChecked: !item.isChecked },
            });
        } catch {
            // Error handled by mutation
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await deleteItem.mutateAsync(itemId);
        } catch {
            // Error handled by mutation
        }
    };

    // If a list is selected, show the detail view
    if (selectedListId && activeList) {
        return (
            <Box>
                {/* List Detail Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Button onClick={() => setSelectedListId(null)} size="small">
                        ← Back
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 700, flex: 1 }}>
                        {activeList.name}
                    </Typography>
                    <IconButton onClick={handleToggleFavourite}>
                        {activeList.isFavourite ? <Star color="warning" /> : <StarBorder />}
                    </IconButton>
                </Box>

                {/* Progress */}
                {items.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('lists.checkedItems', { checked: checkedCount, total: items.length })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {Math.round(progress)}%
                            </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, height: 8 }} />
                    </Box>
                )}

                {/* Add Item */}
                <Card sx={{ mb: 2 }}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                placeholder={t('lists.addItem')}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newItemName.trim()) {
                                        handleAddItem();
                                    }
                                }}
                                size="small"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Add />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                variant="contained"
                                onClick={handleAddItem}
                                disabled={!newItemName.trim() || addItem.isPending}
                                size="small"
                            >
                                {addItem.isPending ? <CircularProgress size={20} /> : t('common.add')}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>

                {/* Items List */}
                {items.length === 0 ? (
                    <Card sx={{ textAlign: 'center', py: 4 }}>
                        <CardContent>
                            <ShoppingCart sx={{ fontSize: 60, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body1" color="text.secondary">
                                No items yet. Add your first item above!
                            </Typography>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <List disablePadding>
                            {/* Unchecked items first */}
                            {items
                                .filter((i: ShoppingListItem) => !i.isChecked)
                                .map((item: ShoppingListItem) => (
                                    <ListItem
                                        key={item.itemId}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => handleDeleteItem(item.itemId)}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        }
                                        disablePadding
                                        sx={{ px: 1 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Checkbox
                                                checked={false}
                                                onChange={() => handleToggleItem(item)}
                                                size="small"
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.name}
                                            secondary={`${item.quantity} ${item.unit}${item.price ? ` · £${item.price.toFixed(2)}` : ''}${item.store ? ` · ${item.store}` : ''}`}
                                        />
                                    </ListItem>
                                ))}

                            {/* Divider between checked/unchecked */}
                            {checkedCount > 0 && items.length - checkedCount > 0 && (
                                <Divider sx={{ my: 1 }} />
                            )}

                            {/* Checked items */}
                            {items
                                .filter((i: ShoppingListItem) => i.isChecked)
                                .map((item: ShoppingListItem) => (
                                    <ListItem
                                        key={item.itemId}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                size="small"
                                                onClick={() => handleDeleteItem(item.itemId)}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        }
                                        disablePadding
                                        sx={{ px: 1, opacity: 0.5 }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Checkbox
                                                checked={true}
                                                onChange={() => handleToggleItem(item)}
                                                size="small"
                                            />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ textDecoration: 'line-through' }}>
                                                    {item.name}
                                                </Typography>
                                            }
                                            secondary={`${item.quantity} ${item.unit}`}
                                        />
                                    </ListItem>
                                ))}
                        </List>
                    </Card>
                )}
            </Box>
        );
    }

    // List overview
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {t('lists.title')}
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
                >
                    {t('lists.createNew')}
                </Button>
            </Box>

            {/* Loading */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Empty State */}
            {!isLoading && lists.length === 0 && (
                <Card sx={{ textAlign: 'center', py: 8 }}>
                    <CardContent>
                        <ShoppingCart sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            {t('lists.emptyState')}
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setCreateDialogOpen(true)}
                        >
                            {t('lists.createNew')}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Shopping List Cards */}
            {!isLoading && lists.length > 0 && (
                <Grid container spacing={2}>
                    {lists.map((list: ShoppingList) => {
                        const listItems = list.items || [];
                        const listChecked = listItems.filter((i: ShoppingListItem) => i.isChecked).length;
                        const listProgress = listItems.length > 0 ? (listChecked / listItems.length) * 100 : 0;

                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={list.listId}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                        },
                                    }}
                                    onClick={() => setSelectedListId(list.listId)}
                                >
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {list.name}
                                            </Typography>
                                            {list.isFavourite && <Star sx={{ color: 'warning.main', fontSize: 20 }} />}
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {t('lists.totalItems', { count: listItems.length })}
                                        </Typography>

                                        {listItems.length > 0 && (
                                            <Box sx={{ mb: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={listProgress}
                                                    sx={{ borderRadius: 4, height: 6 }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {t('lists.checkedItems', { checked: listChecked, total: listItems.length })}
                                                </Typography>
                                            </Box>
                                        )}
                                    </CardContent>
                                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirmId(list.listId);
                                            }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Create List Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{t('lists.createNew')}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="List Name"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateList();
                        }}
                        sx={{ mt: 1 }}
                    />
                    {createList.isError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Failed to create list. Please try again.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateList}
                        disabled={!newListName.trim() || createList.isPending}
                    >
                        {createList.isPending ? <CircularProgress size={20} /> : t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
                <DialogTitle>{t('common.confirm')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this shopping list? This cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmId(null)}>{t('common.cancel')}</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => deleteConfirmId && handleDeleteList(deleteConfirmId)}
                        disabled={deleteList.isPending}
                    >
                        {deleteList.isPending ? <CircularProgress size={20} /> : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
