import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, MenuItem, Select, InputLabel, FormControl, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { Calendar, UserCheck, CreditCard, DollarSign } from 'lucide-react';
import axios from 'axios';

export const Bookings = () => {
  const { accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const [activeBookings, setActiveBookings] = useState([]);
  const [cleanRooms, setCleanRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  
  // Walkin Form State
  const [guestName, setGuestName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchBookingData = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = activeHotelId ? { hotelId: activeHotelId } : {};

      const [roomsRes, bookingsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/hotels/rooms`, { headers, params }),
        axios.get(`${backendUrl}/api/bookings`, { headers, params })
      ]);

      // Filter only Clean/Inspected & Available rooms for new walk-ins
      const filteredRooms = roomsRes.data.filter((r: any) => r.status === 'Available' && (r.housekeepingStatus === 'Clean' || r.housekeepingStatus === 'Inspected'));
      setCleanRooms(filteredRooms);
      
      // Fetch exact active stays from database
      const mappedBookings = bookingsRes.data.map((b: any) => {
        const paid = b.payments ? b.payments.reduce((sum: number, p: any) => sum + p.amount, 0) : 0;
        return {
          id: b._id,
          guestName: b.guestId?.name || 'Walk-In Guest',
          roomNumber: b.rooms ? b.rooms.map((r: any) => r.roomNumber).join(', ') : '',
          checkIn: new Date(b.checkIn).toLocaleDateString(),
          checkOut: new Date(b.checkOut).toLocaleDateString(),
          outstanding: `INR ${(b.totalAmount - paid).toLocaleString()}`,
          vip: b.guestId?.history?.vipTag || false
        };
      });
      setActiveBookings(mappedBookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchBookingData();
  }, [accessToken, activeHotelId]);

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setMsg('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/bookings/create`, {
        hotelId: activeHotelId,
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

      setMsg('Walk-in check-in successfully generated! Confirmation WhatsApp dispatched.');
      fetchBookingData();
      
      // Reset form
      setGuestName('');
      setMobileNumber('');
      setEmail('');
      setAddress('');
      setIdNumber('');
      setSelectedRoomId('');
      setCheckIn('');
      setCheckOut('');
      setAdvancePayment(0);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Booking registration failed.');
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Reception Desk</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Log fast walk-ins, manage check-in dates, and handle guest receipts.</Typography>
      </Box>

      {msg && <Alert severity={msg.includes('successfully') ? 'success' : 'error'} sx={{ mb: 1.5, borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>{msg}</Alert>}

      <Grid container spacing={1.5}>
        {/* Walk-In Form Card */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 0.5 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserCheck size={16} color="#6366f1" /> Express Walk-In Check-In
              </Typography>
              <form onSubmit={handleWalkInSubmit}>
                <Grid container spacing={2}>
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
                    <TextField fullWidth size="small" label="ID proof number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small" required>
                      <InputLabel>Assign Room (Clean & Inspected Only)</InputLabel>
                      <Select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} label="Assign Room (Clean & Inspected Only)">
                        {cleanRooms.map((r) => (
                          <MenuItem key={r._id} value={r._id}>Room {r.roomNumber} ({r.categoryId?.name} - INR {r.categoryId?.basePrice}/night)</MenuItem>
                        ))}
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
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.2, fontWeight: 'bold' }}>
                      Check-In Guest Now
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Stays Grid */}
        <Grid item xs={12} lg={7}>
          <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={20} color="#e11d48" /> Active Stays & Checked-In Folios
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Guest</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Check-in</TableCell>
                  <TableCell>Check-out</TableCell>
                  <TableCell>Outstanding Dues</TableCell>
                  <TableCell>Rating</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeBookings.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.guestName}</TableCell>
                    <TableCell><Chip label={`Room ${row.roomNumber}`} size="small" color="primary" sx={{ fontWeight: 'bold' }} /></TableCell>
                    <TableCell>{row.checkIn}</TableCell>
                    <TableCell>{row.checkOut}</TableCell>
                    <TableCell sx={{ color: 'secondary.main', fontWeight: 'bold' }}>{row.outstanding}</TableCell>
                    <TableCell>
                      {row.vip ? (
                        <Chip label="VIP Guest" size="small" color="secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }} />
                      ) : (
                        <Chip label="Regular Stay" size="small" sx={{ fontSize: '0.65rem' }} />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Bookings;
