import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography } from '@mui/material';
import { Home, Bed, UserPlus, FileText, Settings, ShieldAlert, Coffee, Users, RefreshCw, Contact } from 'lucide-react';

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  const roles = user.roles;
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isDistributor = roles.includes('DISTRIBUTOR');

  const hasFeature = (feat: string) => {
    if (isSuperAdmin) return true;
    if (isDistributor) return user.allowedModules?.includes(feat) || false;
    return user.license?.features?.includes(feat) || false;
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Home size={18} />,
      path: '/dashboard',
      show: true,
    },
    {
      text: 'Interactive Rooms',
      icon: <Bed size={18} />,
      path: '/rooms',
      show: hasFeature('RESERVATIONS') && (isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING'].includes(r))),
    },
    {
      text: 'Walk-In & Bookings',
      icon: <UserPlus size={18} />,
      path: '/bookings',
      show: hasFeature('RESERVATIONS') && (isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(r))),
    },
    {
      text: 'Guest Management',
      icon: <Contact size={18} />,
      path: '/guests',
      show: isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(r)),
    },
    {
      text: 'POS & Restaurant',
      icon: <Coffee size={18} />,
      path: '/pos',
      show: hasFeature('POS') && (isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST'].includes(r))),
    },
    {
      text: 'Accounting Ledger',
      icon: <FileText size={18} />,
      path: '/accounting',
      show: hasFeature('ACCOUNTING') && (isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(r))),
    },
    {
      text: 'Staff & Roles',
      icon: <Users size={18} />,
      path: '/staff',
      show: isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN', 'MANAGER'].includes(r)),
    },
    {
      text: 'Operations Settings',
      icon: <Settings size={18} />,
      path: '/settings',
      show: isSuperAdmin || isDistributor || roles.some(r => ['HOTEL_ADMIN'].includes(r)),
    },
    {
      text: 'Distributor Portal',
      icon: <RefreshCw size={18} />,
      path: '/distributor',
      show: isSuperAdmin || isDistributor,
    },
    {
      text: 'Global SaaS Control',
      icon: <ShieldAlert size={18} />,
      path: '/superadmin',
      show: isSuperAdmin,
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 250,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 250,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', px: 2, py: 3 }}>
        <List>
          {menuItems
            .filter((item) => item.show)
            .map((item, index) => {
              const active = location.pathname === item.path;
              return (
                <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 3,
                      px: 2.5,
                      py: 1.5,
                      bgcolor: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: active ? 'primary.main' : 'text.secondary',
                      '&:hover': {
                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                        color: 'text.primary',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: active ? 'primary.main' : 'text.secondary',
                        minWidth: '35px',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: active ? 700 : 500,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
        </List>
      </Box>
    </Drawer>
  );
};
export default Sidebar;
