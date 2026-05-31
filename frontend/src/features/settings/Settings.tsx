import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, Grid, Card, CardContent, TextField, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  Alert, MenuItem, Tabs, Tab, Divider, CircularProgress, FormControl, Select, InputLabel 
} from '@mui/material';
import { Settings as SettingsIcon, Layers, FolderHeart, Bed, ShieldCheck } from 'lucide-react';
import axios from 'axios';

export const Settings = () => {
  const { user, accessToken } = useSelector((state: any) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');

  // Masters List state
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [floors, setFloors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // 1. General Settings Form state
  const [checkInTime, setCheckInTime] = useState('12:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [currency, setCurrency] = useState('INR');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [receiptPrefix, setReceiptPrefix] = useState('REC-');
  const [cgstPercent, setCgstPercent] = useState<any>(6);
  const [sgstPercent, setSgstPercent] = useState<any>(6);
  const [gstThresholdPrice, setGstThresholdPrice] = useState<any>(1000);

  // 2. Floor Form state
  const [floorNumber, setFloorNumber] = useState('');
  const [floorName, setFloorName] = useState('');

  // 3. Room Category Form state
  const [catName, setCatName] = useState('');
  const [catBasePrice, setCatBasePrice] = useState('');
  const [catCapacity, setCatCapacity] = useState('2');

  // 4. Room Form state
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloorId, setRoomFloorId] = useState('');
  const [roomCategoryId, setRoomCategoryId] = useState('');

  const fetchSettingsAndStructure = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };
      
      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isDistributor = user.roles.includes('DISTRIBUTOR');

      let currentHotelId = user.hotelId;
      if (isSuperAdmin || isDistributor) {
        const hotelsRes = await axios.get(`${backendUrl}/api/hotels`, { headers });
        setHotels(hotelsRes.data);
        if (hotelsRes.data.length > 0) {
          currentHotelId = selectedHotelId || hotelsRes.data[0]._id;
          if (!selectedHotelId) {
            setSelectedHotelId(hotelsRes.data[0]._id);
          }
        }
      }

      const params = currentHotelId ? { hotelId: currentHotelId } : {};

      // Fetch Floors, Room Categories, and Rooms dynamically
      const [floorsRes, catsRes, roomsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/hotels/floors`, { headers, params }),
        axios.get(`${backendUrl}/api/hotels/categories`, { headers, params }),
        axios.get(`${backendUrl}/api/hotels/rooms`, { headers, params })
      ]);

      setFloors(floorsRes.data);
      setCategories(catsRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error('[Fetch Settings Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchSettingsAndStructure();
    }
  }, [accessToken, selectedHotelId]);

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.put(`${backendUrl}/api/hotels/settings`, {
        hotelId: selectedHotelId,
        settings: {
          currency,
          checkInTime,
          checkOutTime,
          invoicePrefix,
          receiptPrefix,
          taxSettings: {
            cgstPercent: parseFloat(cgstPercent),
            sgstPercent: parseFloat(sgstPercent),
            gstThresholdPrice: parseFloat(gstThresholdPrice)
          }
        }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSeverity('success');
      setMsg('General Hotel Settings updated successfully!');
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Settings update failed.');
    }
  };

  const handleFloorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/hotels/floors`, {
        hotelId: selectedHotelId,
        floorNumber,
        name: floorName
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSeverity('success');
      setMsg(`Floor ${floorNumber} successfully configured in Mapped Master!`);
      setFloorNumber('');
      setFloorName('');
      fetchSettingsAndStructure();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Failed to create floor.');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/hotels/categories`, {
        hotelId: selectedHotelId,
        name: catName,
        basePrice: parseFloat(catBasePrice),
        capacity: { adults: parseInt(catCapacity), children: 0 }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSeverity('success');
      setMsg(`Room Category "${catName}" successfully configured!`);
      setCatName('');
      setCatBasePrice('');
      fetchSettingsAndStructure();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Failed to create category.');
    }
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/hotels/rooms`, {
        hotelId: selectedHotelId,
        roomNumber,
        floorId: roomFloorId,
        categoryId: roomCategoryId
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSeverity('success');
      setMsg(`Physical Room ${roomNumber} successfully registered into Inventory!`);
      setRoomNumber('');
      fetchSettingsAndStructure();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Failed to create room.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2.5 }}>
      {/* Title */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>Hotel Structure Master</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Establish floors, specify dynamic tariffs, register rooms, and modify taxation rules.</Typography>
      </Box>

      {/* Hotel Selector for Super Admin scoping */}
      {user.roles.includes('SUPER_ADMIN') && hotels.length > 0 && (
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ACTIVE TENANT SCOPE:</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select value={selectedHotelId} onChange={(e) => setSelectedHotelId(e.target.value)}>
              {hotels.map((h) => (
                <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {msg && <Alert severity={severity} sx={{ mb: 2, borderRadius: 2 }}>{msg}</Alert>}

      {user.roles.includes('SUPER_ADMIN') && hotels.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontWeight: 'bold' }}>
          No active hotels registered in the system database. Please go to the <strong>Global SaaS Control</strong> or <strong>Distributor Portal</strong> to onboard at least one hotel tenant before configuring structural details.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
        <Tabs value={activeTab} onChange={(e, val) => { setActiveTab(val); setMsg(''); }} variant="scrollable" scrollButtons="auto">
          <Tab label="General Settings" icon={<SettingsIcon size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label="Floors Master" icon={<Layers size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label="Room Categories" icon={<FolderHeart size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label="Rooms Master" icon={<Bed size={16} />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* Tab 0: General settings */}
      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={6}>
            <Card sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldCheck size={16} color="#6366f1" /> Operational & Taxation Rules
                </Typography>
                <form onSubmit={handleGeneralSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Check-In Bound (HH:MM)" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Check-Out Bound (HH:MM)" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="SaaS Base Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Invoice Initial Prefix" value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" label="Receipt Initial Prefix" value={receiptPrefix} onChange={(e) => setReceiptPrefix(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" type="number" label="CGST Rate (%)" value={cgstPercent} onChange={(e) => setCgstPercent(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" type="number" label="SGST Rate (%)" value={sgstPercent} onChange={(e) => setSgstPercent(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" type="number" label="GST Threshold Price (INR)" value={gstThresholdPrice} onChange={(e) => setGstThresholdPrice(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button type="submit" variant="contained" fullWidth size="medium" sx={{ fontWeight: 'bold' }} disabled={user.roles.includes('SUPER_ADMIN') && hotels.length === 0}>
                        Save Operational Configurations
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 1: Floors Master */}
      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Add Structural Floor
                </Typography>
                <form onSubmit={handleFloorSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Floor Number (e.g. 1, 2)" value={floorNumber} onChange={(e) => setFloorNumber(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Floor Label Name (e.g. First Floor)" value={floorName} onChange={(e) => setFloorName(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 'bold' }} disabled={user.roles.includes('SUPER_ADMIN') && hotels.length === 0}>
                        Register Floor Location
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={8}>
            <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Configured Hotel Floors</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Floor Number</TableCell>
                    <TableCell>Floor Label Name</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {floors.map((fl) => (
                    <TableRow key={fl._id}>
                      <TableCell sx={{ fontWeight: 650 }}>{fl.floorNumber}</TableCell>
                      <TableCell>{fl.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                  {floors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                        No floors defined. Create one on the left panel!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Room Categories */}
      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Create Room Category
                </Typography>
                <form onSubmit={handleCategorySubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Category Name (e.g. Deluxe, Suite)" value={catName} onChange={(e) => setCatName(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" type="number" label="Base Price Tariff (INR)" value={catBasePrice} onChange={(e) => setCatBasePrice(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" type="number" label="Standard Adult Capacity" value={catCapacity} onChange={(e) => setCatCapacity(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 'bold' }} disabled={user.roles.includes('SUPER_ADMIN') && hotels.length === 0}>
                        Register Category & Tariff
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={8}>
            <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Configured Room Categories & Prices</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Category Name</TableCell>
                    <TableCell>Standard Capacity</TableCell>
                    <TableCell>Base Price Tariff</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat._id}>
                      <TableCell sx={{ fontWeight: 650 }}>{cat.name}</TableCell>
                      <TableCell>{cat.capacity?.adults} Adults</TableCell>
                      <TableCell sx={{ color: 'primary.light', fontWeight: 'bold' }}>INR {cat.basePrice}/night</TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                        No room categories defined. Create one on the left panel!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}

      {/* Tab 3: Rooms Master */}
      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ p: 1.5 }}>
              <CardContent sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Register Room
                </Typography>
                <form onSubmit={handleRoomSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Room Number (e.g. 101, 102)" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} required />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel>Assign Floor</InputLabel>
                        <Select value={roomFloorId} onChange={(e) => setRoomFloorId(e.target.value)} label="Assign Floor">
                          {floors.map((fl) => (
                            <MenuItem key={fl._id} value={fl._id}>Floor {fl.floorNumber} ({fl.name || 'N/A'})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel>Assign Category</InputLabel>
                        <Select value={roomCategoryId} onChange={(e) => setRoomCategoryId(e.target.value)} label="Assign Category">
                          {categories.map((cat) => (
                            <MenuItem key={cat._id} value={cat._id}>{cat.name} (INR {cat.basePrice}/night)</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button type="submit" variant="contained" fullWidth sx={{ fontWeight: 'bold' }} disabled={user.roles.includes('SUPER_ADMIN') && hotels.length === 0}>
                        Register Physical Room
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={8}>
            <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Current Room Inventory Map</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Room Number</TableCell>
                    <TableCell>Floor</TableCell>
                    <TableCell>Room Category</TableCell>
                    <TableCell>Housekeeping</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rooms.map((rm) => (
                    <TableRow key={rm._id}>
                      <TableCell sx={{ fontWeight: 650 }}>
                        <Chip label={`Room ${rm.roomNumber}`} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>Floor {rm.floorId?.floorNumber}</TableCell>
                      <TableCell>{rm.categoryId?.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={rm.housekeepingStatus} 
                          size="small" 
                          variant="outlined"
                          color={rm.housekeepingStatus === 'Clean' || rm.housekeepingStatus === 'Inspected' ? 'success' : 'error'} 
                          sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={rm.status} 
                          size="small" 
                          color={rm.status === 'Available' ? 'success' : (rm.status === 'Occupied' ? 'error' : 'warning')} 
                          sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {rooms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                        No rooms configured in the database inventory. Populate floors and categories first, then add rooms!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
export default Settings;
