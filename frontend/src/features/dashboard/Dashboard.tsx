import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, Card, CardContent, Typography, Box, Skeleton, Avatar, List, 
  ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, InputLabel, FormControl, 
  Alert, Divider 
} from '@mui/material';
import { TrendingUp, Users, DollarSign, Bed, Calendar, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';

export const Dashboard = () => {
  const { user, accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Universal Walk-In Modal state
  const [openWalkIn, setOpenWalkIn] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [cleanRooms, setCleanRooms] = useState<any[]>([]);
  
  // Real database stays and ledger states for dynamic charts
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);

  // Walkin Form Fields
  const [guestName, setGuestName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [advancePayment, setAdvancePayment] = useState<any>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [walkInMsg, setWalkInMsg] = useState('');

  const fetchDashboardMetrics = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      let endpoint = '/api/dashboards/hotel'; // default hotel dashboard

      const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
      const isDistributor = user.roles.includes('DISTRIBUTOR');

      if (isSuperAdmin) {
        endpoint = '/api/dashboards/superadmin';
      } else if (isDistributor) {
        endpoint = '/api/dashboards/distributor';
      }

      const res = await axios.get(`${backendUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMetrics(res.data);

      // Fetch hotels list if Super Admin or Distributor to select scoping
      if (isSuperAdmin || isDistributor) {
        const hotelsRes = await axios.get(`${backendUrl}/api/hotels`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setHotels(hotelsRes.data);
        if (hotelsRes.data.length > 0 && !selectedHotelId) {
          setSelectedHotelId(hotelsRes.data[0]._id);
        }
      } else {
        setSelectedHotelId(user.hotelId);
      }
    } catch (err: any) {
      console.error('[Dashboard Error]', err.message);
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationalData = async (hotelId: string) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = hotelId ? { hotelId } : {};

      // Fetch bookings to calculate occupancy weekly ratios
      const bookingsRes = await axios.get(`${backendUrl}/api/bookings`, { headers, params });
      setActiveBookings(bookingsRes.data);

      // Fetch ledger transactions to calculate cashflow graphs
      const txRes = await axios.get(`${backendUrl}/api/accounting/transactions`, { headers, params });
      setTransactions(txRes.data);

      // Fetch clean rooms of the selected hotel
      const roomsRes = await axios.get(`${backendUrl}/api/hotels/rooms`, { headers, params });
      const filtered = roomsRes.data.filter((r: any) => r.status === 'Available' && (r.housekeepingStatus === 'Clean' || r.housekeepingStatus === 'Inspected'));
      setCleanRooms(filtered);
    } catch (err: any) {
      console.error('[Operational Data Error]', err.message);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchDashboardMetrics();
    }
  }, [user, accessToken, activeHotelId]);

  useEffect(() => {
    if (accessToken && activeHotelId) {
      fetchOperationalData(activeHotelId);
    }
  }, [accessToken, activeHotelId]);

  // Aggregate Dynamic Cashflow Dataset (last 6 months)
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    last6Months.push({
      name: d.toLocaleString('default', { month: 'short' }),
      monthNum: d.getMonth(),
      yearNum: d.getFullYear(),
      amount: 0
    });
  }

  transactions.forEach((tx: any) => {
    if (tx.type === 'Income') {
      const txDate = new Date(tx.date);
      const m = txDate.getMonth();
      const y = txDate.getFullYear();
      const match = last6Months.find(month => month.monthNum === m && month.yearNum === y);
      if (match) {
        match.amount += tx.amount;
      }
    }
  });

  const revenueChartData = last6Months.map((m) => ({
    name: m.name,
    amount: m.amount,
  }));

  // Aggregate Dynamic Weekly Occupancy Ratio
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentWeekDays = daysOfWeek.map((day, idx) => {
    const current = new Date();
    const currentDay = current.getDay();
    const diff = idx - currentDay;
    const targetDate = new Date(current.setDate(current.getDate() + diff));
    targetDate.setHours(0, 0, 0, 0);
    return { dayName: day, dateVal: targetDate };
  });

  const occupancyChartData = currentWeekDays.map(({ dayName, dateVal }) => {
    let occupiedCount = 0;
    activeBookings.forEach((b: any) => {
      if (b.status === 'CheckedIn' || b.status === 'CheckedOut') {
        const checkInDate = new Date(b.checkIn);
        checkInDate.setHours(0, 0, 0, 0);
        const checkOutDate = new Date(b.checkOut);
        checkOutDate.setHours(23, 59, 59, 999);
        
        if (dateVal >= checkInDate && dateVal <= checkOutDate) {
          occupiedCount += b.rooms ? b.rooms.length : 1;
        }
      }
    });

    const ratio = metrics?.availableRooms + metrics?.occupiedRooms > 0 
      ? (occupiedCount / (metrics.availableRooms + metrics.occupiedRooms)) * 100 
      : occupiedCount * 10;
    return { name: dayName, occupied: Math.min(100, Math.round(ratio)) };
  });

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={1.5}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h5" color="error" sx={{ fontWeight: 700, mb: 1 }}>Dashboard Metrics Unreachable</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Could not fetch metrics from the backend API. Please make sure the backend Express server is started and running.
        </Typography>
      </Box>
    );
  }

  const renderSuperAdminCards = () => (
    <>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Active Hotels</Typography>
              <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.15)', color: 'primary.main' }}><Bed size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.activeSubscriptions || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Hotels with running licenses</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Monthly Revenue (MRR)</Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'status.available' }}><DollarSign size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>INR {(metrics?.totalMRR || 0).toLocaleString()}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>SaaS platform aggregates</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>SaaS Distributors</Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: 'status.reserved' }}><Users size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.distributorsCount || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Onboarded distribution partners</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Expired Licenses</Typography>
              <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: 'status.maintenance' }}><AlertCircle size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.expiredSubscriptions || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Licenses in read-only mode</Typography>
          </CardContent>
        </Card>
      </Grid>
    </>
  );

  const renderDistributorCards = () => (
    <>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Assigned Hotels</Typography>
              <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.15)', color: 'primary.main' }}><Bed size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.hotelsCreated || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Total hotels registered</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Active Hotels</Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'status.available' }}><Users size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.activeHotels || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Currently operating hotels</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Monthly Income (20%)</Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'status.available' }}><DollarSign size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>INR {(metrics?.revenueGenerated || 0).toLocaleString()}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Estimated commissions generated</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Expired Partners</Typography>
              <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: 'status.maintenance' }}><AlertCircle size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.expiredHotels || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Subscription renewals pending</Typography>
          </CardContent>
        </Card>
      </Grid>
    </>
  );

  const renderHotelCards = () => (
    <>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Occupancy %</Typography>
              <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.15)', color: 'primary.main' }}><TrendingUp size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{(metrics?.occupancyRate || 0).toFixed(1)}%</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
              {metrics?.occupiedRooms || 0} Occupied / {(metrics?.availableRooms || 0) + (metrics?.occupiedRooms || 0)} Total Rooms
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Revenue Today</Typography>
              <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: 'status.available' }}><DollarSign size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>INR {(metrics?.revenueToday || 0).toLocaleString()}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Revenues generated today</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Today's Checkins / Checkouts</Typography>
              <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: 'status.reserved' }}><Calendar size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{metrics?.checkinsToday || 0} / {metrics?.checkoutsToday || 0}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Arrival / departure checklists</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Pending Dues Folio</Typography>
              <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: 'status.maintenance' }}><AlertCircle size={20} /></Avatar>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>INR {(metrics?.pendingPayments || 0).toLocaleString()}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>Outstanding guest accounts</Typography>
          </CardContent>
        </Card>
      </Grid>
    </>
  );

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInMsg('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/bookings/create`, {
        hotelId: selectedHotelId, // explicitly passed for super admin scope
        guestName,
        mobileNumber,
        email,
        address,
        idProof: { type: idType, number: idNumber },
        roomIds: [selectedRoomId],
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        advancePayment: parseFloat(advancePayment),
        paymentMethod,
        isCheckInNow: true,
        source: 'WalkIn'
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setWalkInMsg('Walk-in guest successfully checked in! Confirmed stay logged.');
      
      // Reload Metrics & Operational list
      fetchDashboardMetrics();
      if (selectedHotelId) fetchOperationalData(selectedHotelId);
      
      // Reset Form fields
      setGuestName('');
      setMobileNumber('');
      setEmail('');
      setAddress('');
      setIdNumber('');
      setSelectedRoomId('');
      setCheckIn('');
      setCheckOut('');
      setAdvancePayment(0);
      
      setTimeout(() => {
        setOpenWalkIn(false);
        setWalkInMsg('');
      }, 2000);
    } catch (err: any) {
      setWalkInMsg(err.response?.data?.error || 'Registration failed. Make sure a target hotel is selected and rooms are configured.');
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* Title with Quick Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.2, letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
            Welcome back, {user.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            Here is your overview for today, {new Date().toDateString()}.
          </Typography>
        </Box>
        {!user.roles.includes('DISTRIBUTOR') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<Users size={14} />}
            onClick={() => setOpenWalkIn(true)}
            sx={{
              background: 'linear-gradient(45deg, #4f46e5, #e11d48)',
              fontWeight: 'bold',
              borderRadius: 2.5,
              boxShadow: '0 3px 10px rgba(99, 102, 241, 0.2)',
              px: 2,
              py: 0.6,
              textTransform: 'none',
              fontSize: '0.8rem'
            }}
          >
            Check-In New Walk-In Guest
          </Button>
        )}
      </Box>

      {/* Global Scope Selector in Navbar scopes all sub-modules synchronously */}

      {/* Metric Cards Grid */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {user.roles.includes('SUPER_ADMIN') && renderSuperAdminCards()}
        {user.roles.includes('DISTRIBUTOR') && renderDistributorCards()}
        {!user.roles.includes('SUPER_ADMIN') && !user.roles.includes('DISTRIBUTOR') && renderHotelCards()}
      </Grid>

      {/* Analytics Charts Grid */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 1.5, height: '210px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>Monthly Cash Flow Statement</Typography>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 1.5, height: '210px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: '0.8rem' }}>Weekly Occupancy Ratio</Typography>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={occupancyChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="occupied" fill="#e11d48" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Feed Block (Hotel Level) */}
      {!user.roles.includes('SUPER_ADMIN') && !user.roles.includes('DISTRIBUTOR') && metrics?.activityFeed && (
        <Grid container spacing={1.5}>
          <Grid item xs={12}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Recent Activity Feed</Typography>
              <List>
                {metrics.activityFeed.map((activity, idx) => (
                  <ListItem key={activity.id} sx={{ px: 0, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <ListItemText
                      primary={activity.title}
                      secondary={activity.subtitle}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'text.primary' }}
                      secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                    />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Universal Express Walk-In Check-In Dialog Modal */}
      <Dialog open={openWalkIn} onClose={() => setOpenWalkIn(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Users size={20} color="#6366f1" /> Express Walk-In Check-In
        </DialogTitle>
        <form onSubmit={handleWalkInSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            {walkInMsg && <Alert severity={walkInMsg.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2, borderRadius: 2 }}>{walkInMsg}</Alert>}
            
            <Grid container spacing={2}>
              {/* Target Hotel dropdown for Super Admin */}
              {user.roles.includes('SUPER_ADMIN') && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Select Target Hotel</InputLabel>
                    <Select value={selectedHotelId} onChange={(e) => setSelectedHotelId(e.target.value)} label="Select Target Hotel">
                      {hotels.map((h) => (
                        <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Guest Full Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Mobile Number" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Residential Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>ID Proof Type</InputLabel>
                  <Select value={idType} onChange={(e) => setIdType(e.target.value)} label="ID Proof Type">
                    <MenuItem value="Aadhaar">Aadhaar Card</MenuItem>
                    <MenuItem value="Passport">Passport</MenuItem>
                    <MenuItem value="Driving License">Driving License</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="ID Proof Number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Assign Room (Clean & Available)</InputLabel>
                  <Select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} label="Assign Room (Clean & Available)">
                    {cleanRooms.map((r) => (
                      <MenuItem key={r._id} value={r._id}>Room {r.roomNumber} ({r.categoryId?.name} - INR {r.categoryId?.basePrice}/night)</MenuItem>
                    ))}
                    {cleanRooms.length === 0 && (
                      <MenuItem disabled value="">No clean rooms available. Setup rooms/clean dirty ones first!</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="date" label="Arrival Date" InputLabelProps={{ shrink: true }} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="date" label="Departure Date" InputLabelProps={{ shrink: true }} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" type="number" label="Advance Paid (INR)" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Mode</InputLabel>
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Mode">
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI (GPay/PhonePe)</MenuItem>
                    <MenuItem value="Card">Credit/Debit Card</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenWalkIn(false)} color="inherit" sx={{ fontWeight: 'bold' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 'bold', px: 3 }}>Check-In Guest Now</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
export default Dashboard;
