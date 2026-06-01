import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Card, CardContent, TextField, Button, Typography, Checkbox, 
  FormControlLabel, InputAdornment, IconButton, Alert, Chip, Grid 
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, Sun, Moon, Shield, Sparkles } from 'lucide-react';
import axios from 'axios';
import { setCredentials, toggleThemeMode } from '../../store/authSlice';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { themeMode } = useSelector((state: any) => state.auth);
  const isDark = themeMode === 'dark';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/api/auth/login`, {
        email,
        password,
        rememberMe,
      }, {
        withCredentials: true,
      });

      const { accessToken, user } = response.data;
      dispatch(setCredentials({ user, accessToken }));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill credentials for testing
  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%, #020617 100%)'
          : 'radial-gradient(ellipse at top, #e0e7ff 0%, #f1f5f9 60%, #f8fafc 100%)',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        py: 4,
        transition: 'background 0.3s ease',
      }}
    >
      {/* Dynamic Blur Orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(0,0,0,0) 70%)',
          top: '-10%',
          left: '10%',
          filter: 'blur(80px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(225, 29, 72, 0.12) 0%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(225, 29, 72, 0.08) 0%, rgba(0,0,0,0) 70%)',
          bottom: '10%',
          right: '5%',
          filter: 'blur(60px)',
        }}
      />

      <Card
        sx={{
          maxWidth: 1024,
          width: '100%',
          borderRadius: 6,
          background: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
          boxShadow: isDark 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
            : '0 25px 50px -12px rgba(99, 102, 241, 0.12)',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        <Grid container>
          {/* Left Panel: Aesthetic Branding Panel (Visible on Desktop only) */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 6,
              background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 50%, #d946ef 100%)',
              position: 'relative',
              color: '#ffffff',
            }}
          >
            {/* Background Texture Overlay */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0.15,
                background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.3) 0%, transparent 60%)',
              }}
            />

            {/* Glowing Logo Card */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 4,
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
                mb: 6,
                zIndex: 2,
              }}
            >
              <Shield size={36} color="#ffffff" style={{ filter: 'drop-shadow(0px 2px 8px rgba(99, 102, 241, 0.3))' }} />
            </Box>

            {/* Platform Tag and Main Heading */}
            <Box sx={{ zIndex: 2, my: 'auto' }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.8,
                  borderRadius: 50,
                  bgcolor: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  mb: 3,
                }}
              >
                <Sparkles size={12} color="#fcd34d" />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  HotelCloud Live OTA Operations Desk
                </Typography>
              </Box>

              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.15, mb: 2.5, letterSpacing: '-0.03em' }}>
                Secure SaaS <br />
                <span style={{ color: '#fcd34d' }}>Management</span>
              </Typography>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.6, fontWeight: 500, maxWith: '90%' }}>
                Experience state-of-the-art multi-tenant operations, granular staff access, automated WhatsApp settlements, and robust accounting ledger management under one unified cloud platform.
              </Typography>
            </Box>

            {/* Footer Brand Link */}
            <Box sx={{ zIndex: 2, mt: 6 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.7, letterSpacing: '0.05em' }}>
                HOTELCLOUD.SAAS
              </Typography>
            </Box>
          </Grid>

          {/* Right Panel: Clean Login Form Panel */}
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              p: { xs: 4, sm: 6 },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              position: 'relative',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              transition: 'background 0.3s ease',
            }}
          >
            {/* Theme Toggle Button (Top Right Corner) */}
            <Box
              sx={{
                position: 'absolute',
                top: 24,
                right: 24,
                zIndex: 3,
              }}
            >
              <Button
                onClick={() => dispatch(toggleThemeMode())}
                variant="outlined"
                startIcon={isDark ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#4f46e5" />}
                sx={{
                  borderRadius: 50,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  px: 2,
                  py: 0.6,
                  textTransform: 'uppercase',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(15, 23, 42, 0.25)',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </Box>

            {/* Header Branding */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #4f46e5, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={18} color="#ffffff" />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 850, letterSpacing: '-0.01em', color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1.1 }}>
                  HOTELCLOUD
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', fontWeight: 600 }}>
                  Secure Access Portal
                </Typography>
              </Box>
            </Box>

            {/* Form Titles */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 850, mb: 1, letterSpacing: '-0.025em', color: isDark ? '#ffffff' : '#0f172a' }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                Sign in to continue accessing your secure cloud hotel dashboard and master console.
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontSize: '0.8rem' }}>{error}</Alert>}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email Address / Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={18} color="#6366f1" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={18} color="#6366f1" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'text.secondary' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={<Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.8rem' }}>Remember Me</Typography>}
                />
                <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 650, fontSize: '0.8rem', '&:hover': { textDecoration: 'underline' } }}>
                  Forgot password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #4f46e5, #8b5cf6)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4338ca, #7c3aed)',
                  },
                }}
              >
                {loading ? 'Authenticating Securely...' : 'Login Securely'}
              </Button>
            </form>

          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default Login;
