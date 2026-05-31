import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Grid, Card, CardContent, Button, TextField, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Alert, Divider, FormControlLabel, Checkbox } from '@mui/material';
import { Coffee, ShoppingCart, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import axios from 'axios';

export const POS = () => {
  const { accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const [cart, setCart] = useState([]);
  const [roomNumber, setRoomNumber] = useState('');
  const [chargeToRoom, setChargeToRoom] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [msg, setMsg] = useState('');

  const menu = [
    { id: 'm1', name: 'Paneer Tikka Butter Masala', price: 280, icon: '🍛' },
    { id: 'm2', name: 'Club Sandwich (with Fries)', price: 180, icon: '🥪' },
    { id: 'm3', name: 'Traditional Filter Coffee', price: 60, icon: '☕' },
    { id: 'm4', name: 'South Indian Dosa Platter', price: 140, icon: '🥞' },
    { id: 'm5', name: 'Mineral Water Bottle (1L)', price: 40, icon: '💧' },
  ];

  const handleAddToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      setCart(cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const handleQtyChange = (itemId, delta) => {
    const existing = cart.find((i) => i.id === itemId);
    if (!existing) return;
    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.id !== itemId));
    } else {
      setCart(cart.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
    }
  };

  const handleRemove = (itemId) => {
    setCart(cart.filter((i) => i.id !== itemId));
  };

  const subTotal = cart.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = subTotal * 0.05; // 5% GST on Restaurant Service
  const grandTotal = subTotal + tax;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setMsg('');

    if (cart.length === 0) {
      setMsg('Cart is currently empty.');
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/pos/create`, {
        hotelId: activeHotelId,
        roomNumber: chargeToRoom ? roomNumber : '',
        orderType: 'Room Service',
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        paymentMethod: chargeToRoom ? 'RoomFolio' : paymentMethod,
        chargeToRoom
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setMsg(chargeToRoom ? `Bill successfully posted to active Folio of Room ${roomNumber}!` : 'POS transaction logged and paid!');
      setCart([]);
      setRoomNumber('');
    } catch (err) {
      setMsg(err.response?.data?.error || 'POS billing post failed.');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Point of Sale (POS)</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Bill restaurant orders, mock room service orders, and add charges directly to guest stays.</Typography>
      </Box>

      {msg && <Alert severity={msg.includes('successfully') || msg.includes('logged') ? 'success' : 'error'} sx={{ mb: 4, borderRadius: 2 }}>{msg}</Alert>}

      <Grid container spacing={4}>
        {/* Menu Catalog Grid */}
        <Grid item xs={12} lg={7}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Restaurant Dine-In & Bar Catalog</Typography>
          <Grid container spacing={2}>
            {menu.map((item) => (
              <Grid item xs={12} sm={6} key={item.id}>
                <Card sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h3">{item.icon}</Typography>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>INR {item.price}</Typography>
                    </Box>
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<Plus size={14} />} onClick={() => handleAddToCart(item)} sx={{ borderRadius: 2 }}>
                    Add
                  </Button>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Shopping Cart Drawer Box */}
        <Grid item xs={12} lg={5}>
          <Card sx={{ p: 1, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCart size={20} color="#6366f1" /> Dining Folio Cart
              </Typography>

              {cart.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Cart is empty. Click items on the left menu to add.</Typography>
                </Box>
              ) : (
                <>
                  <List sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {cart.map((item) => (
                      <ListItem key={item.id} sx={{ px: 0, py: 1, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <ListItemText primary={item.name} secondary={`INR ${item.price} each`} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 2 }}>
                          <IconButton size="small" onClick={() => handleQtyChange(item.id, -1)}><Minus size={14} /></IconButton>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => handleQtyChange(item.id, 1)}><Plus size={14} /></IconButton>
                        </Box>
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleRemove(item.id)} color="secondary"><Trash2 size={16} /></IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ my: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="body2">Subtotal</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>INR {subTotal}</Typography></Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}><Typography variant="body2">Service GST (5%)</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>INR {tax.toFixed(2)}</Typography></Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="h6" sx={{ fontWeight: 700 }}>Total Price</Typography><Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>INR {grandTotal.toFixed(2)}</Typography></Box>
                  </Box>

                  {/* Checkout Folio Settings */}
                  <form onSubmit={handleCheckout}>
                    <FormControlLabel
                      control={<Checkbox checked={chargeToRoom} onChange={(e) => setChargeToRoom(e.target.checked)} />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Post bill directly to Active Guest Room</Typography>}
                      sx={{ mb: 2 }}
                    />

                    {chargeToRoom ? (
                      <TextField fullWidth size="small" label="Occupied Room Number" value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 102" required sx={{ mb: 3 }} />
                    ) : (
                      <TextField fullWidth size="small" select label="Immediate Payment Mode" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} sx={{ mb: 3 }}>
                        <MenuItem value="Cash">Cash Checkout</MenuItem>
                        <MenuItem value="UPI">UPI (GPay/Paytm)</MenuItem>
                        <MenuItem value="Card">Credit Card</MenuItem>
                      </TextField>
                    )}

                    <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.2, fontWeight: 'bold' }} startIcon={<CreditCard size={18} />}>
                      {chargeToRoom ? 'Post Charge to Room Folio' : 'Process Cash Checkout'}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
export default POS;
