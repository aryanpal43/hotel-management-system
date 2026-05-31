import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Avatar, Chip, FormControl, Select, MenuItem } from '@mui/material';
import { Sun, Moon, LogOut, Search } from 'lucide-react';
import { toggleThemeMode, logOut, setActiveHotelId } from '../store/authSlice';
import axios from 'axios';

export const Navbar = () => {
  const dispatch = useDispatch();
  const { user, themeMode, accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const [hotels, setHotels] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user && (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DISTRIBUTOR')) && accessToken) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      axios.get(`${backendUrl}/api/hotels`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).then(res => {
        setHotels(res.data);
        if (res.data.length > 0 && !activeHotelId) {
          dispatch(setActiveHotelId(res.data[0]._id));
        }
      }).catch(err => console.error('[Navbar Fetch Hotels Error]', err));
    }
  }, [user, accessToken, activeHotelId, dispatch]);

  const handleLogout = () => {
    dispatch(logOut());
  };

  return (
    <AppBar position="sticky" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ background: 'linear-gradient(45deg, #4f46e5, #e11d48)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HOTEL CLOUD SaaS
            </span>
          </Typography>
          {user && (
            <Chip
              label={user.roles.join(' & ')}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 'bold', textTransform: 'capitalize', fontSize: '0.75rem', borderColor: 'primary.main' }}
            />
          )}
          {user && (user.roles.includes('SUPER_ADMIN') || user.roles.includes('DISTRIBUTOR')) && hotels.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', fontSize: '0.7rem' }}>HOTEL SCOPE:</Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={activeHotelId || ''}
                  onChange={(e) => dispatch(setActiveHotelId(e.target.value))}
                  sx={{
                    height: 26,
                    fontSize: '0.7rem',
                    color: 'primary.light',
                    fontWeight: 700,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }
                  }}
                >
                  {hotels.map((h) => (
                    <MenuItem key={h._id} value={h._id} sx={{ fontSize: '0.7rem' }}>{h.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Ctrl+K Search Bar Hint */}
          <Button
            variant="outlined"
            onClick={() => {
              // Trigger Command Palette manually by simulating key event
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
              window.dispatchEvent(event);
            }}
            startIcon={<Search size={16} />}
            sx={{
              borderRadius: 3,
              borderColor: 'rgba(255,255,255,0.08)',
              bgcolor: 'rgba(255,255,255,0.04)',
              color: 'text.secondary',
              px: 2,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
              textTransform: 'none',
              fontWeight: 500,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          >
            Search everywhere...
            <Typography variant="caption" sx={{ ml: 2, px: 0.8, py: 0.3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>
              Ctrl + K
            </Typography>
          </Button>

          {/* Theme Mode Selector */}
          <IconButton onClick={() => dispatch(toggleThemeMode())} color="inherit">
            {themeMode === 'dark' ? <Sun size={20} color="#f59e0b" /> : <Moon size={20} color="#4f46e5" />}
          </IconButton>

          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 36,
                  height: 36,
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: -0.2 }}>
                  {user.email}
                </Typography>
              </Box>
            </Box>
          )}

          <IconButton onClick={handleLogout} color="secondary" sx={{ ml: 1 }}>
            <LogOut size={18} />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
export default Navbar;
