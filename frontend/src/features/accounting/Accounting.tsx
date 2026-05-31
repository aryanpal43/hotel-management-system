import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, MenuItem, Select, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Alert } from '@mui/material';
import { DollarSign, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import axios from 'axios';

export const Accounting = () => {
  const { accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Expense form
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Supplies');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchTransactions = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = activeHotelId ? { hotelId: activeHotelId } : {};

      const res = await axios.get(`${backendUrl}/api/accounting/transactions`, {
        headers,
        params
      });
      const mapped = res.data.map((tx: any) => ({
        id: tx._id,
        date: new Date(tx.date).toLocaleDateString(),
        description: tx.description,
        type: tx.type,
        category: tx.category,
        amount: tx.amount,
        method: tx.paymentMethod,
      }));
      setTransactions(mapped);
    } catch (err) {
      console.error('[Accounting fetch]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchTransactions();
  }, [accessToken, activeHotelId]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/accounting/transactions`, {
        hotelId: activeHotelId,
        description,
        type: 'Expense',
        category,
        amount: parseFloat(amount),
        paymentMethod
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setMsg('Operational expense successfully logged into Ledger!');
      fetchTransactions();
      setDescription('');
      setAmount('');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to log expense.');
    }
  };

  // Aggregates
  const totalIncome = transactions.filter((t) => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Accounting Ledger</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Track double-entry checkouts, recurring utility bills, supplies, and net profits.</Typography>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>{msg}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Inflow (Income)</Typography>
                <ArrowUpRight color="#10b981" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'status.available' }}>
                INR {totalIncome.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Outflow (Expenses)</Typography>
                <ArrowDownRight color="#ef4444" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'status.maintenance' }}>
                INR {totalExpense.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Net Monthly Operating Profit</Typography>
                <DollarSign color="#6366f1" />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: netProfit >= 0 ? 'primary.main' : 'error.main' }}>
                INR {netProfit.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Log Expense Form */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                Record Operational Expense
              </Typography>
              <form onSubmit={handleExpenseSubmit}>
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Expense Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Bought 20 bulbs, AC servicing room 104" required />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Expense Category</InputLabel>
                      <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Expense Category">
                        <MenuItem value="Salary">Salary Payout</MenuItem>
                        <MenuItem value="Maintenance">Room/Appliance Repair</MenuItem>
                        <MenuItem value="Electricity">Electricity Utility</MenuItem>
                        <MenuItem value="Water">Water Utility</MenuItem>
                        <MenuItem value="Supplies">Supplies & Cleaning Materials</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" type="number" label="Amount (INR)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Source</InputLabel>
                      <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Source">
                        <MenuItem value="Cash">Cash Ledger Drawer</MenuItem>
                        <MenuItem value="UPI">UPI GPay Business</MenuItem>
                        <MenuItem value="Bank Transfer">Bank Current Account</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button type="submit" variant="contained" color="secondary" fullWidth size="large" sx={{ py: 1.2, fontWeight: 'bold' }}>
                      Log Cash Outflow
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Ledger table */}
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FileText size={20} color="#6366f1" /> Transaction Journal
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Flow</TableCell>
                  <TableCell>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{tx.description}</TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell>{tx.method}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type}
                        size="small"
                        color={tx.type === 'Income' ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: tx.type === 'Income' ? 'status.available' : 'status.maintenance' }}>
                      {tx.type === 'Income' ? '+' : '-'} INR {tx.amount}
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
export default Accounting;
