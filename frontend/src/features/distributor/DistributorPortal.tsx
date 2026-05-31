import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, MenuItem, Divider, Dialog, DialogTitle, DialogContent, DialogActions, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { Building, Hotel, PlusCircle, Settings } from 'lucide-react';
import axios from 'axios';

interface HotelLicense {
  _id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  license: {
    planName: string;
    expiryDate: string;
    rawExpiryDate: string;
    roomLimit: number;
    userLimit: number;
    features: string[];
  };
}

export const DistributorPortal = () => {
  const { user, accessToken } = useSelector((state: any) => state.auth);
  const [hotels, setHotels] = useState<HotelLicense[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // Form State
  const [hotelName, setHotelName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [waApiUrl, setWaApiUrl] = useState('');
  const [waApiToken, setWaApiToken] = useState('');
  const [waSenderNumber, setWaSenderNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  // License Override Dialog State
  const [openOverride, setOpenOverride] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelLicense | null>(null);
  const [overridePlanName, setOverridePlanName] = useState('Starter');
  const [overrideExpiry, setOverrideExpiry] = useState('');
  const [overrideRoomLimit, setOverrideRoomLimit] = useState('20');
  const [overrideUserLimit, setOverrideUserLimit] = useState('5');
  const [overrideStatus, setOverrideStatus] = useState('Active');
  const [overrideFeatures, setOverrideFeatures] = useState<string[]>([]);

  const fetchDistributorData = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // Fetch dynamic subscription plans from database
      const plansRes = await axios.get(`${backendUrl}/api/subscription-plans`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      setPlans(plansRes.data);
      if (plansRes.data.length > 0) {
        setSelectedPlanId(plansRes.data[0]._id);
      }

      // Fetch dynamic hotels list
      const hotelsRes = await axios.get(`${backendUrl}/api/hotels`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const mappedHotels = hotelsRes.data.map((h: any) => ({
        _id: h._id,
        name: h.name,
        ownerName: h.ownerName || 'N/A',
        email: h.email || 'N/A',
        phone: h.phone || 'N/A',
        status: h.status || 'Active',
        license: {
          planName: h.license?.planName || 'Starter',
          expiryDate: h.license?.expiryDate ? new Date(h.license.expiryDate).toLocaleDateString() : 'N/A',
          rawExpiryDate: h.license?.expiryDate || '',
          roomLimit: h.license?.roomLimit || 0,
          userLimit: h.license?.userLimit || 0,
          features: h.license?.features || []
        }
      }));
      setHotels(mappedHotels);
    } catch (err) {
      console.error('[Distributor Fetch Error]', err);
    }
  };

  useEffect(() => {
    if (accessToken) fetchDistributorData();
  }, [accessToken]);

  const handleOnboardHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // Distributor posts registering details directly to live database
      await axios.post(`${backendUrl}/api/hotels/register`, {
        name: hotelName,
        ownerName,
        email,
        phone,
        planId: selectedPlanId,
        adminName,
        adminEmail,
        adminPassword,
        gstNumber,
        panNumber,
        website,
        address: { street, city, state, zip },
        whatsappConfig: {
          apiUrl: waApiUrl,
          apiToken: waApiToken,
          senderNumber: waSenderNumber
        }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setMsg('Hotel registered successfully! Login credentials dispatched to hotel administrator.');
      fetchDistributorData();

      setHotelName('');
      setOwnerName('');
      setEmail('');
      setPhone('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setGstNumber('');
      setPanNumber('');
      setWebsite('');
      setStreet('');
      setCity('');
      setState('');
      setZip('');
      setWaApiUrl('');
      setWaApiToken('');
      setWaSenderNumber('');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Registration failed.');
    }
  };
  const handleOpenOverride = (hotel: HotelLicense) => {
    setSelectedHotel(hotel);
    setOverridePlanName(hotel.license?.planName || 'Starter');
    if (hotel.license?.rawExpiryDate) {
      const formatted = new Date(hotel.license.rawExpiryDate).toISOString().split('T')[0];
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
      await axios.put(`${backendUrl}/api/hotels/${selectedHotel?._id}/license`, {
        planName: overridePlanName,
        expiryDate: new Date(overrideExpiry),
        roomLimit: parseInt(overrideRoomLimit),
        userLimit: parseInt(overrideUserLimit),
        status: overrideStatus,
        features: overrideFeatures
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setMsg(`License boundaries for "${selectedHotel?.name}" successfully overriden!`);
      setOpenOverride(false);
      fetchDistributorData();
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'License override failed.');
    }
  };
  return (
    <Box sx={{ p: 2.5 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>Distributor Console</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Onboard new hotel customers, assign operational plans, and review earnings.</Typography>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{msg}</Alert>}

      {/* Reselling Permissions */}
      {user.allowedModules && (
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, p: 1.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', textTransform: 'uppercase' }}>
            Your Reseller Allowed Modules:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
            {user.allowedModules.map((m: string) => (
              <Chip key={m} label={m} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
            ))}
            {user.allowedModules.length === 0 && (
              <Chip label="NONE (SUSPENDED)" size="small" color="error" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
            )}
          </Box>
        </Box>
      )}

      <Grid container spacing={2}>
        {/* Onboarding Form */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 1.5 }}>
            <CardContent sx={{ p: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PlusCircle size={16} color="#6366f1" /> Onboard Hotel Tenant
              </Typography>
              <form onSubmit={handleOnboardHotel}>
                <Grid container spacing={1.5}>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Hotel Brand Name" value={hotelName} onChange={(e) => setHotelName(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Owner Full Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Owner Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Hotel Primary Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" select label="Subscription Tier" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                      {plans.map((p) => {
                        const allowedFeats = p.features?.filter((f: string) => user.allowedModules?.includes(f)) || [];
                        return (
                          <MenuItem key={p._id} value={p._id}>
                            {p.name} (INR {p.price}/mo) - Features: {allowedFeats.length > 0 ? allowedFeats.join(', ') : 'None'}
                          </MenuItem>
                        );
                      })}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      fullWidth
                      onClick={() => setShowConfig(!showConfig)}
                      sx={{ textTransform: 'none', fontWeight: 'bold', fontSize: '0.7rem', py: 0.5 }}
                    >
                      {showConfig ? 'Hide Advanced Settings' : 'Configure WhatsApp, Tax & Address (Optional)'}
                    </Button>
                  </Grid>

                  {showConfig && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="GST Number" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="PAN Number" value={panNumber} onChange={(e) => setPanNumber(e.target.value)} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Website URL" value={website} onChange={(e) => setWebsite(e.target.value)} />
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
                      <Grid item xs={12}>
                        <Divider sx={{ my: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.light', display: 'block', mb: 1 }}>
                          WHATSAPP CONFIGURATION (OPTIONAL):
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="WhatsApp API URL" value={waApiUrl} onChange={(e) => setWaApiUrl(e.target.value)} placeholder="https://api.mockwhatsapp.com/v1" />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="WhatsApp Token" value={waApiToken} onChange={(e) => setWaApiToken(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="WhatsApp Sender Number" value={waSenderNumber} onChange={(e) => setWaSenderNumber(e.target.value)} placeholder="+919999999999" />
                      </Grid>
                    </>
                  )}

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 1 }}>
                      HOTEL ADMIN LOGIN DETAIL:
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Admin Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Admin Email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button type="submit" variant="contained" fullWidth size="small" sx={{ py: 1, fontWeight: 'bold' }}>
                      Register Hotel Admin
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Assigned Hotels List */}
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Building size={16} color="#6366f1" /> Assigned Hotels List
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Hotel Name</TableCell>
                  <TableCell>Owner Name</TableCell>
                  <TableCell>Subscription Tier</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Limits</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hotels.map((h) => (
                  <TableRow key={h._id}>
                    <TableCell sx={{ fontWeight: 650 }}>{h.name}</TableCell>
                    <TableCell>{h.ownerName}</TableCell>
                    <TableCell><Chip label={h.license.planName} size="small" color="primary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }} /></TableCell>
                    <TableCell>{h.license.expiryDate}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                      Rooms: {h.license.roomLimit} | Users: {h.license.userLimit}
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
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* License Override Dialog Modal */}
      {selectedHotel && (
        <Dialog open={openOverride} onClose={() => setOpenOverride(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings size={20} color="#6366f1" /> Override License bounds
          </DialogTitle>
          <form onSubmit={handleOverrideSubmit}>
            <DialogContent dividers sx={{ p: 2.5 }}>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Configure quota limits, allowed features, and status for <strong>{selectedHotel.name}</strong>.
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" select label="Plan Tier" value={overridePlanName} onChange={(e) => setOverridePlanName(e.target.value)}>
                    {plans.map((p) => (
                      <MenuItem key={p._id} value={p.name}>{p.name} Tier</MenuItem>
                    ))}
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
                  <FormGroup sx={{ display: 'flex', flexDirection: 'column' }}>
                    {['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'].map((mod) => {
                      const isResellable = user.allowedModules?.includes(mod);
                      if (!isResellable) return null; // Only show features distributor is allowed to resell
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
              <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 'bold' }}>Commit Changes</Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
};
export default DistributorPortal;
