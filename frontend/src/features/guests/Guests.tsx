import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, Card, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert, 
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, 
  Select, InputLabel, FormControl, Divider, CircularProgress, InputAdornment,
  Avatar, Tooltip, Zoom, Fade
} from '@mui/material';
import { 
  UserCheck, ShieldAlert, Award, CreditCard, Receipt, Phone, Mail, 
  Search, Users, Star, ArrowRight, UserPlus, Filter
} from 'lucide-react';
import axios from 'axios';

export const Guests = () => {
  const { accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const [guests, setGuests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'inhouse' | 'vip'>('all');

  // Checkout Modal State
  const [openCheckout, setOpenCheckout] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [finalPayment, setFinalPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);

  const fetchGuestsAndBookings = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = activeHotelId ? { hotelId: activeHotelId } : {};

      const [guestsRes, bookingsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/guests`, { headers, params }),
        axios.get(`${backendUrl}/api/bookings`, { headers, params })
      ]);

      setGuests(guestsRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      console.error('[Guests Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchGuestsAndBookings();
  }, [accessToken, activeHotelId]);

  const handleOpenCheckout = (booking: any) => {
    const paid = booking.payments ? booking.payments.reduce((sum: number, p: any) => sum + p.amount, 0) : 0;
    const outstanding = Math.max(0, booking.totalAmount - paid);
    
    setSelectedBooking(booking);
    setFinalPayment(outstanding);
    setPaymentMethod('Cash');
    setInvoiceDetails(null);
    setOpenCheckout(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${backendUrl}/api/bookings/checkout`, {
        bookingId: selectedBooking._id,
        paymentMethod,
        finalPaymentAmount: parseFloat(finalPayment.toString())
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setSeverity('success');
      setMsg(`Checkout successful! Outstanding dues cleared for ${selectedBooking.guestId?.name}.`);
      setInvoiceDetails(res.data.invoice);
      fetchGuestsAndBookings();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Checkout process failed.');
    }
  };

  // Filter & Search Logic
  const filteredGuests = guests.filter((g) => {
    const matchesSearch = 
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.mobileNumber?.includes(searchQuery) ||
      (g.email && g.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const activeStay = bookings.find(b => b.guestId?._id === g._id && b.status === 'CheckedIn');

    if (filterType === 'inhouse') {
      return matchesSearch && !!activeStay;
    }
    if (filterType === 'vip') {
      return matchesSearch && g.history?.vipTag;
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Fade in={true} timeout={400}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Compact Header */}
        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 850, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={20} color="#6366f1" /> Guest Directory & Ledger
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Track guest stay histories, manage VIP metrics, and execute live checkout billing.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              icon={<Users size={12} />} 
              label={`Total Scoped: ${guests.length}`} 
              size="small" 
              variant="outlined" 
              sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} 
            />
            <Chip 
              icon={<Star size={12} color="#f59e0b" />} 
              label={`VIP Count: ${guests.filter(g => g.history?.vipTag).length}`} 
              size="small" 
              variant="outlined" 
              sx={{ fontWeight: 'bold', fontSize: '0.7rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }} 
            />
          </Box>
        </Box>

        {msg && !openCheckout && (
          <Alert severity={severity} sx={{ mb: 1.5, borderRadius: 2.5, py: 0.5, fontSize: '0.75rem' }} onClose={() => setMsg('')}>
            {msg}
          </Alert>
        )}

        {/* Compact Search & Filter Toolbar */}
        <Paper 
          sx={{ 
            p: 1, 
            mb: 1.5, 
            borderRadius: 3.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, maxWidth: { xs: '100%', sm: 400 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, mobile number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2.5,
                  height: 34,
                  fontSize: '0.8rem'
                }
              }}
            />
          </Box>

          {/* Quick Filters */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter size={14} color="#94a3b8" style={{ marginRight: 4 }} />
            <Button
              size="small"
              variant={filterType === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilterType('all')}
              sx={{ borderRadius: 2, textTransform: 'none', px: 2, height: 28, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              All Profiles
            </Button>
            <Button
              size="small"
              variant={filterType === 'inhouse' ? 'contained' : 'outlined'}
              color="success"
              onClick={() => setFilterType('inhouse')}
              sx={{ borderRadius: 2, textTransform: 'none', px: 2, height: 28, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              Inhouse Stay
            </Button>
            <Button
              size="small"
              variant={filterType === 'vip' ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => setFilterType('vip')}
              sx={{ borderRadius: 2, textTransform: 'none', px: 2, height: 28, fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              VIP Ledger
            </Button>
          </Box>
        </Paper>

        {/* Viewport-Locked Table Container */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            flexGrow: 1, 
            borderRadius: 4, 
            maxHeight: 'calc(100vh - 190px)', 
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            bgcolor: 'background.paper'
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'background.paper', fontWeight: 800, fontSize: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' } }}>
                <TableCell>Guest Profile</TableCell>
                <TableCell>Contact Details</TableCell>
                <TableCell>Nationality</TableCell>
                <TableCell>Stay History</TableCell>
                <TableCell align="right">Status & Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGuests.map((g) => {
                const activeStay = bookings.find(b => b.guestId?._id === g._id && b.status === 'CheckedIn');
                const initials = g.name ? g.name.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() : 'G';

                return (
                  <TableRow 
                    key={g._id}
                    hover
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '& td': { py: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }
                    }}
                  >
                    {/* Guest Profile with Letter Badge */}
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            fontSize: '0.8rem', 
                            fontWeight: 'bold', 
                            bgcolor: g.history?.vipTag ? 'secondary.main' : 'primary.main',
                            boxShadow: g.history?.vipTag ? '0 0 10px rgba(244, 63, 94, 0.2)' : 'none'
                          }}
                        >
                          {initials}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 750, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.825rem' }}>
                            {g.name}
                            {g.history?.vipTag && (
                              <Tooltip title="Exclusive VIP Guest Profile" placement="top" TransitionComponent={Zoom} arrow>
                                <Chip 
                                  label="VIP" 
                                  size="small" 
                                  color="secondary" 
                                  sx={{ height: 16, fontSize: '0.55rem', fontWeight: 900, px: 0.5 }} 
                                  icon={<Award size={9} />} 
                                />
                              </Tooltip>
                            )}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.68rem' }}>
                            ID: {g.idProof?.type || 'Aadhaar'} - {g.idProof?.number || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Contact details */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.primary', fontWeight: 550, fontSize: '0.75rem' }}>
                          <Phone size={10} color="#6366f1" /> {g.mobileNumber}
                        </Typography>
                        {g.email && (
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'text.secondary', fontSize: '0.7rem' }}>
                            <Mail size={10} color="#f43f5e" /> {g.email}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{g.nationality || 'Indian'}</TableCell>

                    {/* Stay Ledger Statistics */}
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          Visits: <strong style={{ color: '#6366f1' }}>{g.history?.totalVisits || 0}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          Spend: <strong style={{ color: '#10b981' }}>INR {(g.history?.totalSpend || 0).toLocaleString()}</strong>
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status & Check Out Trigger */}
                    <TableCell align="right">
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                        {activeStay ? (
                          <>
                            <Chip 
                              label={`Active Stay: Room ${activeStay.rooms?.map((r: any) => r.roomNumber).join(', ')}`} 
                              color="success" 
                              variant="outlined" 
                              size="small" 
                              sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 20 }} 
                            />
                            <Tooltip title="Mark customer checkout & settle bill transactions" arrow>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenCheckout(activeStay)}
                                sx={{
                                  background: 'linear-gradient(45deg, #10b981, #6366f1)',
                                  fontWeight: 'bold',
                                  fontSize: '0.65rem',
                                  height: 22,
                                  px: 1.5,
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                                }}
                              >
                                Mark Check-Out
                              </Button>
                            </Tooltip>
                          </>
                        ) : (
                          <Chip 
                            label="Checked Out" 
                            size="small" 
                            variant="outlined" 
                            sx={{ color: 'text.secondary', fontSize: '0.65rem', height: 18, borderColor: 'rgba(255,255,255,0.06)' }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredGuests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 4, fontSize: '0.8rem' }}>
                    No registered guests match the selected filter/search parameters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Checkout Modal Dialog */}
        {selectedBooking && (
          <Dialog open={openCheckout} onClose={() => setOpenCheckout(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <UserCheck size={20} color="#10b981" /> Guest Check-Out & Settlement
            </DialogTitle>
            <form onSubmit={handleCheckoutSubmit}>
              <DialogContent dividers sx={{ p: 3 }}>
                {msg && <Alert severity={severity} sx={{ mb: 2, borderRadius: 2 }}>{msg}</Alert>}

                {invoiceDetails ? (
                  <Fade in={true}>
                    <Box sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.08)', bgcolor: 'background.paper' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.main', mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Receipt size={16} /> Guest Invoice Generated (Settled)
                      </Typography>
                      <Grid container spacing={1.5} sx={{ fontSize: '0.8rem' }}>
                        <Grid item xs={6}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Sub Total (Rent):</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography variant="body2" sx={{ fontWeight: 'bold' }}>INR {invoiceDetails.subTotal.toLocaleString()}</Typography></Grid>
                        
                        <Grid item xs={6}><Typography variant="body2" sx={{ color: 'text.secondary' }}>CGST:</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography variant="body2" sx={{ fontWeight: 'bold' }}>INR {invoiceDetails.cgst.toFixed(2)}</Typography></Grid>
                        
                        <Grid item xs={6}><Typography variant="body2" sx={{ color: 'text.secondary' }}>SGST:</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography variant="body2" sx={{ fontWeight: 'bold' }}>INR {invoiceDetails.sgst.toFixed(2)}</Typography></Grid>
                        
                        <Grid item xs={12}><Divider sx={{ my: 0.5 }} /></Grid>
                        
                        <Grid item xs={6}><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Grand Total Price:</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography variant="subtitle2" sx={{ fontWeight: 850, color: 'primary.main' }}>INR {invoiceDetails.grandTotal.toFixed(2)}</Typography></Grid>
                        
                        <Grid item xs={6}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Paid:</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>INR {invoiceDetails.paymentsReceived.toFixed(2)}</Typography></Grid>
                        
                        <Grid item xs={6}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Outstanding Balance:</Typography></Grid>
                        <Grid item xs={6} align="right"><Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>INR {invoiceDetails.outstandingBalance.toFixed(2)}</Typography></Grid>
                      </Grid>
                    </Box>
                  </Fade>
                ) : (
                  <Box>
                    <Box sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: 'rgba(255,255,255,0.01)' }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.light', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
                        Current Stay Summary
                      </Typography>
                      <Grid container spacing={1} sx={{ fontSize: '0.8rem' }}>
                        <Grid item xs={4}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Guest Name:</Typography></Grid>
                        <Grid item xs={8}><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedBooking.guestId?.name}</Typography></Grid>
                        
                        <Grid item xs={4}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Room(s) Stay:</Typography></Grid>
                        <Grid item xs={8}>
                          <Chip label={`Room ${selectedBooking.rooms?.map((r: any) => r.roomNumber).join(', ')}`} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 'bold' }} />
                        </Grid>
                        
                        <Grid item xs={4}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Rent Tariff total:</Typography></Grid>
                        <Grid item xs={8}><Typography variant="body2" sx={{ fontWeight: 700 }}>INR {selectedBooking.totalAmount.toLocaleString()}</Typography></Grid>
                        
                        <Grid item xs={4}><Typography variant="body2" sx={{ color: 'text.secondary' }}>Advance Paid:</Typography></Grid>
                        <Grid item xs={8}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                            INR {(selectedBooking.payments ? selectedBooking.payments.reduce((sum: number, p: any) => sum + p.amount, 0) : 0).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          fullWidth 
                          size="small" 
                          type="number" 
                          label="Settle Final Payment Amount (INR)" 
                          value={finalPayment} 
                          onChange={(e) => setFinalPayment(parseFloat(e.target.value) || 0)} 
                          required 
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Final Settle Mode</InputLabel>
                          <Select 
                            value={paymentMethod} 
                            onChange={(e) => setPaymentMethod(e.target.value)} 
                            label="Final Settle Mode"
                            sx={{ borderRadius: 2.5 }}
                          >
                            <MenuItem value="Cash">Cash Ledger</MenuItem>
                            <MenuItem value="UPI">UPI (GPay/Paytm)</MenuItem>
                            <MenuItem value="Card">Credit/Debit Card</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={() => setOpenCheckout(false)} color="inherit" sx={{ fontWeight: 'bold', textTransform: 'none' }}>
                  {invoiceDetails ? 'Close Portal' : 'Cancel'}
                </Button>
                {!invoiceDetails && (
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="success" 
                    sx={{ 
                      fontWeight: 'bold', 
                      px: 3,
                      textTransform: 'none',
                      borderRadius: 2.5,
                      background: 'linear-gradient(45deg, #10b981, #059669)',
                    }}
                    startIcon={<CreditCard size={16} />}
                  >
                    Settle & Check Out Now
                  </Button>
                )}
              </DialogActions>
            </form>
          </Dialog>
        )}
      </Box>
    </Fade>
  );
};

export default Guests;
