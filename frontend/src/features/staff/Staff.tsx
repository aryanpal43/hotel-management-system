import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, Typography, Grid, Card, CardContent, TextField, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, 
  Checkbox, FormControlLabel, FormGroup, Alert, Divider, IconButton 
} from '@mui/material';
import { Users, UserPlus, ShieldAlert, FileEdit, CheckSquare, Square } from 'lucide-react';
import axios from 'react-redux'; // wait, import axios from 'axios' is standard
import axiosInstance from 'axios';

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  granularPermissions: any[];
  isActive: boolean;
}

export const Staff = () => {
  const axios = axiosInstance;
  const { accessToken } = useSelector((state: any) => state.auth);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');

  // Form State
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['RECEPTIONIST']);

  const defaultPages = [
    { page: 'dashboard', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'rooms', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'bookings', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'housekeeping', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'maintenance', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'inventory', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'accounting', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'pos', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'users', create: false, edit: false, delete: false, export: false, approve: false },
    { page: 'settings', create: false, edit: false, delete: false, export: false, approve: false }
  ];

  const [permissions, setPermissions] = useState<any[]>(defaultPages);

  const fetchStaff = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.get(`${backendUrl}/api/users/staff`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setStaff(res.data);
    } catch (err) {
      console.error('[Staff Fetch Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchStaff();
  }, [accessToken]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handlePermissionCellToggle = (pageName: string, actionKey: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.page === pageName ? { ...p, [actionKey]: !p[actionKey] } : p
      )
    );
  };

  // Helper Preset triggers
  const grantFullAccess = () => {
    setPermissions(
      defaultPages.map((p) => ({
        page: p.page,
        create: true,
        edit: true,
        delete: true,
        export: true,
        approve: true
      }))
    );
  };

  const clearAllPermissions = () => {
    setPermissions(defaultPages);
  };

  const applyRolePreset = (presetName: 'RECEPTIONIST' | 'ACCOUNTANT' | 'HOUSEKEEPER') => {
    const updated = defaultPages.map((p) => {
      if (presetName === 'RECEPTIONIST') {
        if (['dashboard', 'rooms', 'bookings', 'pos'].includes(p.page)) {
          return { page: p.page, create: true, edit: true, delete: false, export: true, approve: true };
        }
      } else if (presetName === 'ACCOUNTANT') {
        if (['dashboard', 'accounting'].includes(p.page)) {
          return { page: p.page, create: true, edit: true, delete: true, export: true, approve: true };
        }
      } else if (presetName === 'HOUSEKEEPER') {
        if (['dashboard', 'rooms', 'housekeeping'].includes(p.page)) {
          return { page: p.page, create: false, edit: true, delete: false, export: false, approve: false };
        }
      }
      return p;
    });
    setPermissions(updated);
  };

  const handleEditClick = (employee: StaffUser) => {
    setEditUserId(employee._id);
    setName(employee.name);
    setEmail(employee.email);
    setPassword(''); // leave blank
    setSelectedRoles(employee.roles);

    const savedPerms = employee.granularPermissions || [];
    const mapped = defaultPages.map((dp) => {
      const match = savedPerms.find((sp: any) => sp.page === dp.page);
      return match ? {
        page: dp.page,
        create: match.create || false,
        edit: match.edit || false,
        delete: match.delete || false,
        export: match.export || false,
        approve: match.approve || false
      } : dp;
    });
    setPermissions(mapped);
  };

  const handleCancelEdit = () => {
    setEditUserId(null);
    setName('');
    setEmail('');
    setPassword('');
    setSelectedRoles(['RECEPTIONIST']);
    setPermissions(defaultPages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    if (selectedRoles.length === 0) {
      setSeverity('error');
      setMsg('Please assign at least one role.');
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };

      if (editUserId) {
        // Update operational staff profile
        await axios.put(`${backendUrl}/api/users/staff/update`, {
          userId: editUserId,
          name,
          email,
          roles: selectedRoles,
          granularPermissions: permissions,
          isActive: true
        }, { headers });
        setSeverity('success');
        setMsg(`Staff credentials for "${email}" updated successfully!`);
      } else {
        // Create new staff profile
        await axios.post(`${backendUrl}/api/users/staff/create`, {
          name,
          email,
          password,
          roles: selectedRoles,
          granularPermissions: permissions
        }, { headers });
        setSeverity('success');
        setMsg(`Employee "${email}" registered successfully! Initial credentials dispatched.`);
      }

      fetchStaff();
      handleCancelEdit();
    } catch (err: any) {
      setSeverity('error');
      setMsg(err.response?.data?.error || 'Access settings configuration failed.');
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, letterSpacing: '-0.02em' }}>Staff & Roles Control</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Configure logins, set multi-roles, and construct visual permission matrices.</Typography>
      </Box>

      {msg && <Alert severity={severity} sx={{ mb: 1.5, borderRadius: 2, py: 0.5, fontSize: '0.8rem' }}>{msg}</Alert>}

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {/* Form Container */}
        <Grid item xs={12}>
          <Card sx={{ p: 1 }}>
            <CardContent sx={{ p: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserPlus size={16} color="#6366f1" /> {editUserId ? 'Modify Employee Access Settings' : 'Register New Employee'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Credentials signup pane */}
                  <Grid item xs={12} md={4}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Employee Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Login Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth size="small" label={editUserId ? 'New Password (Optional)' : 'Login Password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editUserId} />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          ASSIGN FUNCTIONAL ROLES:
                        </Typography>
                        <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.5 }}>
                          {['MANAGER', 'RECEPTIONIST', 'ACCOUNTANT', 'HOUSEKEEPING'].map((role) => (
                            <FormControlLabel
                              key={role}
                              control={
                                <Checkbox
                                  checked={selectedRoles.includes(role)}
                                  onChange={() => handleRoleToggle(role)}
                                  size="small"
                                />
                              }
                              label={<Typography variant="caption" sx={{ fontWeight: 600 }}>{role}</Typography>}
                            />
                          ))}
                        </FormGroup>
                      </Grid>

                      <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
                        <Button type="submit" variant="contained" fullWidth size="medium" sx={{ fontWeight: 'bold' }}>
                          {editUserId ? 'Update Profile' : 'Register Profile'}
                        </Button>
                        {editUserId && (
                          <Button onClick={handleCancelEdit} variant="outlined" color="inherit" sx={{ fontWeight: 'bold' }}>
                            Cancel
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Visual Permission Grid Matrix Pane */}
                  <Grid item xs={12} md={8}>
                    <Box sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2, p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShieldAlert size={14} color="#e11d48" /> ACCESS PERMISSION MATRIX
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined" color="primary" onClick={grantFullAccess} sx={{ fontSize: '0.65rem', py: 0.2 }}>Grant Owner Access</Button>
                          <Button size="small" variant="outlined" color="secondary" onClick={() => applyRolePreset('RECEPTIONIST')} sx={{ fontSize: '0.65rem', py: 0.2 }}>Receptionist Preset</Button>
                          <Button size="small" variant="outlined" color="secondary" onClick={() => applyRolePreset('ACCOUNTANT')} sx={{ fontSize: '0.65rem', py: 0.2 }}>Accountant Preset</Button>
                          <Button size="small" variant="outlined" color="inherit" onClick={clearAllPermissions} sx={{ fontSize: '0.65rem', py: 0.2 }}>Clear All</Button>
                        </Box>
                      </Box>

                      <TableContainer component={Paper} sx={{ maxHeight: 220, overflow: 'auto', borderRadius: 2 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Operational Page / Module</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>View / Read</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Create</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Edit / Update</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Delete</TableCell>
                              <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Approve</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {permissions.map((p) => (
                              <TableRow key={p.page}>
                                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                  {p.page === 'pos' ? 'POS & Restaurant' : p.page}
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox size="small" checked={p.export} onChange={() => handlePermissionCellToggle(p.page, 'export')} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox size="small" checked={p.create} onChange={() => handlePermissionCellToggle(p.page, 'create')} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox size="small" checked={p.edit} onChange={() => handlePermissionCellToggle(p.page, 'edit')} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox size="small" checked={p.delete} onChange={() => handlePermissionCellToggle(p.page, 'delete')} />
                                </TableCell>
                                <TableCell align="center">
                                  <Checkbox size="small" checked={p.approve} onChange={() => handlePermissionCellToggle(p.page, 'approve')} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Directory Table */}
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TableContainer component={Paper} sx={{ p: 1.5, borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={16} color="#6366f1" /> Active Hotel Staff Directory
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Assigned Roles</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell sx={{ fontWeight: 600 }}>{employee.name}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {employee.roles.map((r) => (
                          <Chip key={r} label={r} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.65rem', fontWeight: 'bold' }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={employee.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={employee.isActive ? 'success' : 'error'}
                        sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileEdit size={12} />}
                        onClick={() => handleEditClick(employee)}
                        sx={{ fontSize: '0.65rem', py: 0.2 }}
                      >
                        Edit Access
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {staff.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 3 }}>
                      No staff users found. Log new profiles on the form above!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Staff;
