import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, Grid, Card, CardContent, TextField, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  Alert, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
  Checkbox, FormControlLabel, FormGroup, DialogContentText, Divider
} from '@mui/material';
import { Shield, PlusCircle, Building, Settings, RefreshCw, KeyRound } from 'lucide-react';
import axios from 'axios';

export const SuperAdminPortal = () => {
  const { accessToken } = useSelector((state: any) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');

  // SaaS states
  const [plans, setPlans] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);

  // 1. Subscription Plan Form state
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [roomLimit, setRoomLimit] = useState('20');
  const [userLimit, setUserLimit] = useState('5');

  // 2. License Override Modal state
  const [openOverride, setOpenOverride] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [overridePlanName, setOverridePlanName] = useState('Starter');
  const [overrideExpiry, setOverrideExpiry] = useState('');
  const [overrideRoomLimit, setOverrideRoomLimit] = useState('20');
  const [overrideUserLimit, setOverrideUserLimit] = useState('5');
  const [overrideStatus, setOverrideStatus] = useState('Active');
  const [overrideFeatures, setOverrideFeatures] = useState<string[]>([]);

  // 3. Onboarding Form State
  const [hotelName, setHotelName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [website, setWebsite] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [waApiUrl, setWaApiUrl] = useState('');
  const [waApiToken, setWaApiToken] = useState('');
  const [waSenderNumber, setWaSenderNumber] = useState('');

  // 4. Distributor Management State
  const [distributors, setDistributors] = useState<any[]>([]);
  const [distName, setDistName] = useState('');
  const [distEmail, setDistEmail] = useState('');
  const [distPassword, setDistPassword] = useState('');
  const [distAllowedModules, setDistAllowedModules] = useState<string[]>(['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING']);
  const [selectedDistributor, setSelectedDistributor] = useState<any>(null);
  const [openDistEdit, setOpenDistEdit] = useState(false);
  const [editDistName, setEditDistName] = useState('');
  const [editDistEmail, setEditDistEmail] = useState('');
  const [editDistPassword, setEditDistPassword] = useState('');
  const [editDistAllowedModules, setEditDistAllowedModules] = useState<string[]>([]);
  const [editDistIsActive, setEditDistIsActive] = useState(true);

  const fetchSaaSData = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };

      // Fetch dynamic subscription plans, hotels, and distributors
      const [plansRes, hotelsRes, distributorsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/subscription-plans`, { headers }),
        axios.get(`${backendUrl}/api/hotels`, { headers }),
        axios.get(`${backendUrl}/api/distributors`, { headers })
      ]);

      setPlans(plansRes.data);
      if (plansRes.data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plansRes.data[0]._id);
      }
      setHotels(hotelsRes.data);
      setDistributors(distributorsRes.data);
    } catch (err) {
      console.error('[Fetch SaaS Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchSaaSData();
    }
  }, [accessToken]);

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/subscription-plans`, {
        name: planName,
        price: parseFloat(planPrice),
        limits: {
          rooms: parseInt(roomLimit),
          users: parseInt(userLimit)
        }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSeverity('success');
      setMsg(`Subscription Plan "${planName}" successfully provisioned!`);
      setPlanName('');
      setPlanPrice('');
      fetchSaaSData();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Plan creation failed.');
    }
  };

  const handleOpenOverride = (hotel: any) => {
    setSelectedHotel(hotel);
    setOverridePlanName(hotel.license?.planName || 'Starter');
    // Format expiry date to YYYY-MM-DD
    if (hotel.license?.expiryDate) {
      const formatted = new Date(hotel.license.expiryDate).toISOString().split('T')[0];
      setOverrideExpiry(formatted);
    } else {
      setOverrideExpiry('');
    }
    setOverrideRoomLimit(hotel.license?.roomLimit?.toString() || '20');
    setOverrideUserLimit(hotel.license?.userLimit?.toString() || '5');
    setOverrideStatus(hotel.status || 'Active');
    setOverrideFeatures(hotel.license?.features || []);
    setOpenOverride(true);
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.put(`${backendUrl}/api/hotels/${selectedHotel._id}/license`, {
        planName: overridePlanName,
        expiryDate: new Date(overrideExpiry),
        roomLimit: parseInt(overrideRoomLimit),
        userLimit: parseInt(overrideUserLimit),
        status: overrideStatus,
        features: overrideFeatures
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSeverity('success');
      setMsg(`License boundaries for "${selectedHotel.name}" successfully overriden!`);
      setOpenOverride(false);
      fetchSaaSData();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'License override failed.');
    }
  };

  const handleOnboardHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      await axios.post(`${backendUrl}/api/hotels/register`, {
        name: hotelName,
        ownerName,
        gstNumber,
        panNumber,
        address: { street, city, state, zip },
        email,
        phone,
        website,
        planId: selectedPlanId,
        adminName,
        adminEmail,
        adminPassword,
        whatsappConfig: {
          apiUrl: waApiUrl,
          apiToken: waApiToken,
          senderNumber: waSenderNumber
        }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSeverity('success');
      setMsg(`Hotel tenant "${hotelName}" onboarded successfully! Login credentials emailed to Admin.`);
      fetchSaaSData();

      // Reset form
      setHotelName('');
      setOwnerName('');
      setGstNumber('');
      setPanNumber('');
      setStreet('');
      setCity('');
      setState('');
      setZip('');
      setWebsite('');
      setEmail('');
      setPhone('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setWaApiUrl('');
      setWaApiToken('');
      setWaSenderNumber('');
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Onboarding failed.');
    }
  };

  const handleDistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/distributors`, {
        name: distName,
        email: distEmail,
        password: distPassword,
        allowedModules: distAllowedModules
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSeverity('success');
      setMsg(`Distributor "${distName}" successfully onboarded!`);
      setDistName('');
      setDistEmail('');
      setDistPassword('');
      setDistAllowedModules(['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING']);
      fetchSaaSData();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Distributor creation failed.');
    }
  };

  const handleOpenDistEdit = (dist: any) => {
    setSelectedDistributor(dist);
    setEditDistName(dist.name);
    setEditDistEmail(dist.email);
    setEditDistPassword('');
    setEditDistAllowedModules(dist.allowedModules || []);
    setEditDistIsActive(dist.isActive !== false);
    setOpenDistEdit(true);
  };

  const handleDistUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const body: any = {
        name: editDistName,
        email: editDistEmail,
        allowedModules: editDistAllowedModules,
        isActive: editDistIsActive
      };
      if (editDistPassword) {
        body.password = editDistPassword;
      }
      await axios.put(`${backendUrl}/api/distributors/${selectedDistributor._id}`, body, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSeverity('success');
      setMsg(`Distributor "${editDistName}" successfully updated!`);
      setOpenDistEdit(false);
      fetchSaaSData();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Distributor update failed.');
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Title */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>Global SaaS Dashboard</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Provision plans, override tenant licenses, adjust limits, and inspect payout balances.</Typography>
      </Box>

      {msg && <Alert severity={severity} sx={{ mb: 1.5, borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>{msg}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs value={activeTab} onChange={(e, val) => { setActiveTab(val); setMsg(''); }} variant="scrollable" scrollButtons="auto">
          <Tab label="Manage Software Plans" icon={<PlusCircle size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label="License Override Controls" icon={<Shield size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label="Onboard Hotel Tenant" icon={<Building size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label="Manage Distributors" icon={<RefreshCw size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* Tab 0: Manage Software Plans */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlusCircle size={16} color="#6366f1" /> Create Software Plan
                </Typography>
                <form onSubmit={handlePlanSubmit}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Plan Tier Name (e.g. Pro, Premium)" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" type="number" label="Monthly License Tariff (INR)" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" type="number" label="Room Count Limit" value={roomLimit} onChange={(e) => setRoomLimit(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" type="number" label="User Login Limit" value={userLimit} onChange={(e) => setUserLimit(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button type="submit" variant="contained" fullWidth size="small" sx={{ fontWeight: 'bold' }}>
                        Register Software Plan
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={8}>
            <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>System Subscription Plans</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Plan Tier Name</TableCell>
                    <TableCell>Room Quota</TableCell>
                    <TableCell>User Logins</TableCell>
                    <TableCell>Monthly Price Tariff</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell sx={{ fontWeight: 650 }}>{p.name}</TableCell>
                      <TableCell>{p.limits?.rooms} Rooms</TableCell>
                      <TableCell>{p.limits?.users} Logins</TableCell>
                      <TableCell sx={{ color: 'primary.light', fontWeight: 'bold' }}>INR {p.price}/mo</TableCell>
                    </TableRow>
                  ))}
                  {plans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                        No software plans defined. Create one on the left panel!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: License Override Controls */}
      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield size={16} color="#e11d48" /> Active SaaS Tenant License Directory
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hotel Name</TableCell>
                    <TableCell>Owner Name</TableCell>
                    <TableCell>Plan Tier</TableCell>
                    <TableCell>License Expiry</TableCell>
                    <TableCell>Rooms / Logins Limits</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hotels.map((h) => (
                    <TableRow key={h._id}>
                      <TableCell sx={{ fontWeight: 650 }}>{h.name}</TableCell>
                      <TableCell>{h.ownerName}</TableCell>
                      <TableCell>
                        <Chip label={h.license?.planName} size="small" color="primary" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>
                        {h.license?.expiryDate ? new Date(h.license.expiryDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        Rooms: {h.license?.roomLimit} | Logins: {h.license?.userLimit}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={h.status || 'Active'} 
                          size="small" 
                          color={h.status === 'Active' ? 'success' : 'error'} 
                          sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Settings size={12} />}
                          onClick={() => handleOpenOverride(h)}
                          sx={{ fontSize: '0.65rem', py: 0.2 }}
                        >
                          Override License
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {hotels.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                        No hotel tenants registered on the platform yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Onboard Hotel Tenant */}
      {activeTab === 2 && (
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <CardContent sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Building size={18} color="#6366f1" /> Global Tenant Registration Portal
            </Typography>
            <form onSubmit={handleOnboardHotel}>
              <Grid container spacing={2.5}>
                
                {/* 1. Brand Profile & Tax details */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', height: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.light', textTransform: 'uppercase', display: 'block', mb: 2 }}>
                      1. Brand Profile & Tax Credentials
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Hotel Brand Name" value={hotelName} onChange={(e) => setHotelName(e.target.value)} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Owner Full Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="GST Number (optional)" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="PAN Number (optional)" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Website URL (optional)" value={website} onChange={(e) => setWebsite(e.target.value)} />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* 2. Communication & Subscription */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', height: '100%' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.light', textTransform: 'uppercase', display: 'block', mb: 2 }}>
                      2. Contact Details & Subscription
                    </Typography>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Primary Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Owner Contact Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" select label="Subscription Plan Tier" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} required>
                          {plans.map((p) => (
                            <MenuItem key={p._id} value={p._id}>{p.name} (INR {p.price}/mo)</MenuItem>
                          ))}
                          {plans.length === 0 && (
                            <MenuItem value="">No Plans Available - Create one first!</MenuItem>
                          )}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Street" value={street} onChange={(e) => setStreet(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="State" value={state} onChange={(e) => setState(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                {/* 3. Administration Credentials */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.light', textTransform: 'uppercase', display: 'block', mb: 2 }}>
                        3. Provision Admin Credentials
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="Administrator Full Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="Admin Email Address" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="Secure Password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.light', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                        4. WhatsApp Configuration (Optional)
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="WhatsApp API URL" value={waApiUrl} onChange={(e) => setWaApiUrl(e.target.value)} placeholder="https://api.mockwhatsapp.com/v1" />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="WhatsApp Token" value={waApiToken} onChange={(e) => setWaApiToken(e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth size="small" label="WhatsApp Sender Number" value={waSenderNumber} onChange={(e) => setWaSenderNumber(e.target.value)} placeholder="+919999999999" />
                        </Grid>
                      </Grid>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      <Button type="submit" variant="contained" fullWidth size="medium" sx={{ fontWeight: 'bold', py: 1 }}>
                        Onboard Tenant & Deploy Credentials
                      </Button>
                    </Box>
                  </Box>
                </Grid>

              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Manage Distributors */}
      {activeTab === 3 && (
        <Grid container spacing={2}>
          {/* Onboarding Form */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PlusCircle size={16} color="#6366f1" /> Onboard Distributor
                </Typography>
                <form onSubmit={handleDistSubmit}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Distributor Full Name" value={distName} onChange={(e) => setDistName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Primary Email Address" type="email" value={distEmail} onChange={(e) => setDistEmail(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Secure Password" type="password" value={distPassword} onChange={(e) => setDistPassword(e.target.value)} required />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 1, mt: 0.5 }}>
                        ALLOWED FEATURES TO RESELL:
                      </Typography>
                      <FormGroup>
                        {['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'].map((mod) => {
                          const isChecked = distAllowedModules.includes(mod);
                          return (
                            <FormControlLabel
                              key={mod}
                              control={
                                <Checkbox
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setDistAllowedModules([...distAllowedModules, mod]);
                                    } else {
                                      setDistAllowedModules(distAllowedModules.filter(m => m !== mod));
                                    }
                                  }}
                                  color="primary"
                                  size="small"
                                />
                              }
                              label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{mod}</Typography>}
                              sx={{ my: -0.2 }}
                            />
                          );
                        })}
                      </FormGroup>
                    </Grid>

                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button type="submit" variant="contained" fullWidth size="small" sx={{ fontWeight: 'bold', py: 1 }}>
                        Register Distributor
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Distributors List */}
          <Grid item xs={12} lg={8}>
            <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RefreshCw size={16} color="#6366f1" /> Registered Reseller Distributors
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Distributor Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Allowed Modules</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distributors.map((d) => (
                    <TableRow key={d._id}>
                      <TableCell sx={{ fontWeight: 650 }}>{d.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{d.email}</TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {d.allowedModules?.map((m) => (
                            <Chip key={m} label={m} size="small" color="secondary" variant="outlined" sx={{ fontSize: '0.55rem', height: 16 }} />
                          ))}
                          {(!d.allowedModules || d.allowedModules.length === 0) && (
                            <Chip label="NONE" size="small" color="default" sx={{ fontSize: '0.55rem', height: 16 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={d.isActive !== false ? 'Active' : 'Suspended'} 
                          size="small" 
                          color={d.isActive !== false ? 'success' : 'error'} 
                          sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Settings size={12} />}
                          onClick={() => handleOpenDistEdit(d)}
                          sx={{ fontSize: '0.65rem', py: 0.2 }}
                        >
                          Modify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {distributors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                        No distributors registered on the platform yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* License Override Dialog Modal */}
      {selectedHotel && (
        <Dialog open={openOverride} onClose={() => setOpenOverride(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield size={20} color="#e11d48" /> Override License boundaries
          </DialogTitle>
          <form onSubmit={handleOverrideSubmit}>
            <DialogContent dividers sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                You are manually overriding the active license, quota limits, and system bounds for <strong>{selectedHotel.name}</strong>.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" select label="Plan Tier" value={overridePlanName} onChange={(e) => setOverridePlanName(e.target.value)}>
                    {plans.map((p) => (
                      <MenuItem key={p._id} value={p.name}>{p.name} Tier</MenuItem>
                    ))}
                    {plans.length === 0 && (
                      <>
                        <MenuItem value="Starter">Starter Tier</MenuItem>
                        <MenuItem value="Professional">Professional Tier</MenuItem>
                        <MenuItem value="Enterprise">Enterprise Tier</MenuItem>
                      </>
                    )}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} value={overrideExpiry} onChange={(e) => setOverrideExpiry(e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="number" label="Rooms Limit" value={overrideRoomLimit} onChange={(e) => setOverrideRoomLimit(e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="number" label="Users Limit" value={overrideUserLimit} onChange={(e) => setOverrideUserLimit(e.target.value)} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" select label="Subscription Status" value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value)}>
                    <MenuItem value="Active">Active Operational</MenuItem>
                    <MenuItem value="Suspended">Suspended (Read-Only)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 1, mt: 1 }}>
                    ALLOWED FEATURES / MODULES FOR HOTEL:
                  </Typography>
                  <FormGroup>
                    {['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'].map((mod) => {
                      const isChecked = overrideFeatures.includes(mod);
                      return (
                        <FormControlLabel
                          key={mod}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setOverrideFeatures([...overrideFeatures, mod]);
                                } else {
                                  setOverrideFeatures(overrideFeatures.filter(m => m !== mod));
                                }
                              }}
                              color="primary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{mod}</Typography>}
                          sx={{ my: -0.2 }}
                        />
                      );
                    })}
                  </FormGroup>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenOverride(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
              <Button type="submit" variant="contained" color="error" sx={{ fontWeight: 'bold' }}>Commit Overrides</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}

      {/* Distributor Edit Dialog Modal */}
      {selectedDistributor && (
        <Dialog open={openDistEdit} onClose={() => setOpenDistEdit(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <RefreshCw size={20} color="#6366f1" /> Modify Distributor Settings
          </DialogTitle>
          <form onSubmit={handleDistUpdateSubmit}>
            <DialogContent dividers sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Modify permissions, status, or details for distributor <strong>{selectedDistributor.name}</strong>.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Distributor Full Name" value={editDistName} onChange={(e) => setEditDistName(e.target.value)} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Primary Email Address" type="email" value={editDistEmail} onChange={(e) => setEditDistEmail(e.target.value)} required />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="New Password (leave blank to keep unchanged)" type="password" value={editDistPassword} onChange={(e) => setEditDistPassword(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" select label="Account Status" value={editDistIsActive ? 'Active' : 'Suspended'} onChange={(e) => setEditDistIsActive(e.target.value === 'Active')}>
                    <MenuItem value="Active">Active Operational</MenuItem>
                    <MenuItem value="Suspended">Suspended (Deactivated)</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 1 }}>
                    ALLOWED MODULES / FEATURES TO RESELL:
                  </Typography>
                  <FormGroup>
                    {['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'].map((mod) => {
                      const isChecked = editDistAllowedModules.includes(mod);
                      return (
                        <FormControlLabel
                          key={mod}
                          control={
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDistAllowedModules([...editDistAllowedModules, mod]);
                                } else {
                                  setEditDistAllowedModules(editDistAllowedModules.filter(m => m !== mod));
                                }
                              }}
                              color="primary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{mod}</Typography>}
                        />
                      );
                    })}
                  </FormGroup>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDistEdit(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 'bold' }}>Save Changes</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
};
export default SuperAdminPortal;
