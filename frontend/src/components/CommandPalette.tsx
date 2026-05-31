import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent, InputBase, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import { Search, Home, Bed, UserPlus, FileText, Settings, Moon, Sun, ShieldAlert, Coffee } from 'lucide-react';
import { toggleThemeMode } from '../store/authSlice';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { themeMode, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { title: 'Go to Dashboard', shortcut: 'G D', icon: <Home size={18} />, action: () => navigate('/dashboard') },
    { title: 'Interactive Rooms Grid', shortcut: 'G R', icon: <Bed size={18} />, action: () => navigate('/rooms') },
    { title: 'Guest Walk-in Check-In', shortcut: 'G W', icon: <UserPlus size={18} />, action: () => navigate('/bookings') },
    { title: 'Restaurant POS Billing', shortcut: 'G P', icon: <Coffee size={18} />, action: () => navigate('/pos') },
    { title: 'Ledger & Accounting', shortcut: 'G A', icon: <FileText size={18} />, action: () => navigate('/accounting') },
    { title: 'Hotel Operations Settings', shortcut: 'G S', icon: <Settings size={18} />, action: () => navigate('/settings') },
    { title: `Toggle ${themeMode === 'dark' ? 'Light' : 'Dark'} Mode`, shortcut: 'T T', icon: themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />, action: () => dispatch(toggleThemeMode()) },
  ];

  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleRunCommand = (command) => {
    command.action();
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: themeMode === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Search size={20} color="#6366f1" style={{ marginRight: '12px' }} />
        <InputBase
          placeholder="Type a command or page shortcut... (e.g. Rooms, Toggle Theme)"
          fullWidth
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ fontSize: '1rem', color: 'text.primary' }}
        />
        <Box sx={{ border: '1px solid rgba(255,255,255,0.15)', px: 1, py: 0.5, borderRadius: 1.5, display: 'flex', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>ESC</Typography>
        </Box>
      </Box>
      <DialogContent sx={{ p: 1, maxHeight: '350px' }}>
        <List>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, idx) => (
              <ListItemButton
                key={idx}
                onClick={() => handleRunCommand(command)}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)' } }}
              >
                <ListItemIcon sx={{ color: 'primary.main', minWidth: '40px' }}>
                  {command.icon}
                </ListItemIcon>
                <ListItemText
                  primary={command.title}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: 'text.primary' }}
                />
                <Box sx={{ opacity: 0.7 }}>
                  <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.06)', px: 1, py: 0.5, borderRadius: 1, color: 'text.secondary', fontFamily: 'monospace' }}>
                    {command.shortcut}
                  </Typography>
                </Box>
              </ListItemButton>
            ))
          ) : (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>No matching shortcuts found.</Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
};
export default CommandPalette;
