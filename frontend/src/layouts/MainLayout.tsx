import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Avatar,
    Menu,
    MenuItem,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ShoppingCart as ListsIcon,
    Kitchen as InventoryIcon,
    MenuBook as RecipesIcon,
    CalendarMonth as MealPlannerIcon,
    CompareArrows as PricesIcon,
    AutoAwesome as AIIcon,
    Dashboard as DashboardIcon,
    Settings as SettingsIcon,
    DarkMode as DarkModeIcon,
    LightMode as LightModeIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { useStore } from '../store';
import { ROUTES } from '../constants/routes';

const DRAWER_WIDTH = 280;

const navItems = [
    { label: 'nav.dashboard', icon: <DashboardIcon />, path: ROUTES.DASHBOARD },
    { label: 'nav.lists', icon: <ListsIcon />, path: ROUTES.LISTS },
    { label: 'nav.inventory', icon: <InventoryIcon />, path: ROUTES.INVENTORY },
    { label: 'nav.recipes', icon: <RecipesIcon />, path: ROUTES.RECIPES },
    { label: 'nav.discover', icon: <RecipesIcon />, path: ROUTES.DISCOVER_RECIPES },
    {
        label: 'nav.mealPlanner',
        icon: <MealPlannerIcon />,
        path: ROUTES.MEAL_PLANNER,
    },
    { label: 'nav.prices', icon: <PricesIcon />, path: ROUTES.PRICES },
    { label: 'nav.ai', icon: <AIIcon />, path: ROUTES.AI_TOOLS },
];

export const MainLayout = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, themeMode, toggleTheme, sidebarOpen, toggleSidebar, logout } =
        useStore();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleProfileMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleProfileMenuClose();
        logout();
        navigate(ROUTES.LOGIN);
    };

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                    }}
                >
                    AI
                </Box>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {t('app.name')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {t('app.tagline')}
                    </Typography>
                </Box>
            </Box>

            <Divider />

            <List sx={{ flex: 1, px: 1, py: 1 }}>
                {navItems.map((item) => (
                    <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (isMobile) toggleSidebar();
                            }}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    backgroundColor: `${theme.palette.primary.main}15`,
                                    color: theme.palette.primary.main,
                                    '& .MuiListItemIcon-root': {
                                        color: theme.palette.primary.main,
                                    },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={t(item.label)} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Divider />

            <List sx={{ px: 1, py: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        sx={{ borderRadius: 2 }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('nav.settings')} />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={sidebarOpen}
                onClose={toggleSidebar}
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        borderRight: `1px solid ${theme.palette.divider}`,
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Main Content */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    ml: !isMobile && sidebarOpen ? 0 : 0,
                    transition: 'margin 0.3s',
                }}
            >
                {/* Top Bar */}
                <AppBar
                    position="sticky"
                    color="default"
                    elevation={0}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.paper,
                    }}
                >
                    <Toolbar>
                        <IconButton edge="start" onClick={toggleSidebar} sx={{ mr: 2 }}>
                            <MenuIcon />
                        </IconButton>

                        <Box sx={{ flex: 1 }} />

                        <IconButton onClick={toggleTheme} sx={{ mr: 1 }}>
                            {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>

                        <IconButton onClick={handleProfileMenuOpen}>
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: theme.palette.primary.main,
                                    fontSize: '0.875rem',
                                }}
                            >
                                {user?.firstName?.[0] || <PersonIcon />}
                            </Avatar>
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleProfileMenuClose}
                        >
                            <MenuItem
                                onClick={() => {
                                    handleProfileMenuClose();
                                    navigate(ROUTES.PROFILE);
                                }}
                            >
                                {t('nav.profile')}
                            </MenuItem>
                            <MenuItem
                                onClick={() => {
                                    handleProfileMenuClose();
                                    navigate(ROUTES.SETTINGS);
                                }}
                            >
                                {t('nav.settings')}
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>{t('nav.logout')}</MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>

                {/* Page Content */}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        p: 3,
                        backgroundColor: theme.palette.background.default,
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};
