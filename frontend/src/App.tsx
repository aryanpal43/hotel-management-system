import React from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logOut } from './store/authSlice';
import { store } from './store';
import axios from 'axios';

// Conditional desktop software routing support (HashRouter for local file:// loader)
const Router = ({ children }: { children: React.ReactNode }) => {
  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
  return isElectron ? (
    <HashRouter>{children}</HashRouter>
  ) : (
    <BrowserRouter>{children}</BrowserRouter>
  );
};

// Global Axios Response Interceptor for 401 Unauthorized Session Expiration
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or unauthorized - force clean logout and redirect to login page
      store.dispatch(logOut());
      // Clear localStorage just in case state logOut reducer didn't fire
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      // Perform clean browser-level redirect to clear context
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import { getTheme } from './theme/theme';
import { SocketProvider } from './context/SocketContext';
import CommandPalette from './components/CommandPalette';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import Rooms from './features/rooms/Rooms';
import Bookings from './features/bookings/Bookings';
import POS from './features/pos/POS';
import Accounting from './features/accounting/Accounting';
import Staff from './features/staff/Staff';
import DistributorPortal from './features/distributor/DistributorPortal';
import SuperAdminPortal from './features/superadmin/SuperAdminPortal';
import Settings from './features/settings/Settings';
import Guests from './features/guests/Guests'; // Sync-reload verified

// Protected Route Shield
const ProtectedLayout = ({ children }) => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 64px)', overflow: 'hidden', position: 'relative' }}>
        <Sidebar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100%',
            overflowY: 'auto',
            p: 1.5,
            minWidth: 0,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0b0f19' : '#f8fafc',
            transition: 'background-color 0.3s ease',
          }}
        >
          {children}
        </Box>
      </Box>
      <CommandPalette />
    </Box>
  );
};

// Role-Based Router Guard
const RoleShield = ({ children, allowedRoles }) => {
  const { user } = useSelector((state: any) => state.auth);
  
  if (!user) return null;
  
  const hasRole = user.roles.some((role: string) => allowedRoles.includes(role));
  if (!hasRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export const App = () => {
  const { themeMode } = useSelector((state: any) => state.auth);
  const theme = getTheme(themeMode);
  const dispatch = useDispatch();

  // Global 401 interceptor is registered at module scope above to handle instant redirects

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT' || activeEl.tagName === 'TEXTAREA')
        ) {
          if (activeEl.getAttribute('type') === 'submit') return;

          const form = activeEl.closest('form');
          if (form) {
            const selectors = 'input:not([disabled]):not([type=hidden]):not([readonly]), select:not([disabled]), textarea:not([disabled]), button[type=submit]';
            const focusable = Array.from(form.querySelectorAll(selectors)) as HTMLElement[];
            const index = focusable.indexOf(activeEl as HTMLElement);

            if (index > -1 && index < focusable.length - 1) {
              e.preventDefault();
              const nextEl = focusable[index + 1];
              nextEl.focus();
              if (nextEl.tagName === 'INPUT') {
                (nextEl as HTMLInputElement).select();
              }
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SocketProvider>
        <Router>
          <Routes>
            {/* Open login */}
            <Route path="/login" element={<Login />} />

            {/* Shielded Console endpoints */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/rooms"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST', 'HOUSEKEEPING']}>
                    <Rooms />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']}>
                    <Bookings />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']}>
                    <POS />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/accounting"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER', 'ACCOUNTANT']}>
                    <Accounting />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER']}>
                    <Staff />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/distributor"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR']}>
                    <DistributorPortal />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminPortal />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN']}>
                    <Settings />
                  </RoleShield>
                </ProtectedLayout>
              }
            />
            <Route
              path="/guests"
              element={
                <ProtectedLayout>
                  <RoleShield allowedRoles={['SUPER_ADMIN', 'DISTRIBUTOR', 'HOTEL_ADMIN', 'MANAGER', 'RECEPTIONIST']}>
                    <Guests />
                  </RoleShield>
                </ProtectedLayout>
              }
            />

            {/* Fallback navigation */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
};
export default App;
