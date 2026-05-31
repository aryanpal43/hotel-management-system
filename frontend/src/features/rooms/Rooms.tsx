import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Card, CardContent, Grid, Button, Drawer, MenuItem, Select, InputLabel, FormControl, Divider, Chip, Avatar, Badge, TextField, Alert } from '@mui/material';
import { Hammer, RotateCw, User, ClipboardList, CheckCircle } from 'lucide-react';
import axios from 'axios';

export const Rooms = () => {
  const { accessToken, activeHotelId } = useSelector((state: any) => state.auth);
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [housekeepingStatus, setHousekeepingStatus] = useState('');
  const [maintenanceIssue, setMaintenanceIssue] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState('Medium');
  const [msg, setMsg] = useState('');

  const fetchRoomsAndFloors = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const headers = { Authorization: `Bearer ${accessToken}` };
      const params = activeHotelId ? { hotelId: activeHotelId } : {};

      const [roomsRes, floorsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/hotels/rooms`, { headers, params }),
        axios.get(`${backendUrl}/api/hotels/floors`, { headers, params }),
      ]);
      setRooms(roomsRes.data);
      setFloors(floorsRes.data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchRoomsAndFloors();
  }, [accessToken, activeHotelId]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setHousekeepingStatus(room.housekeepingStatus);
    setDrawerOpen(true);
  };

  const handleUpdateHousekeeping = async () => {
    try {
      setMsg('');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // Look up housekeeping tasks to find the active ticket or invoke status toggle
      const tasksRes = await axios.get(`${backendUrl}/api/housekeeping/tasks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: activeHotelId ? { hotelId: activeHotelId } : {}
      });
      const activeTask = tasksRes.data.find(t => t.roomId._id === selectedRoom._id && t.status !== 'Inspected');

      if (activeTask) {
        await axios.put(`${backendUrl}/api/housekeeping/update`, {
          taskId: activeTask._id,
          status: housekeepingStatus,
          hotelId: activeHotelId
        }, { headers: { Authorization: `Bearer ${accessToken}` } });
      } else {
        // Log new housekeeping trigger
        const triggerRes = await axios.post(`${backendUrl}/api/housekeeping/trigger`, {
          roomId: selectedRoom._id,
          notes: 'Status update override',
          hotelId: activeHotelId
        }, { headers: { Authorization: `Bearer ${accessToken}` } });
        
        await axios.put(`${backendUrl}/api/housekeeping/update`, {
          taskId: triggerRes.data.task._id,
          status: housekeepingStatus,
          hotelId: activeHotelId
        }, { headers: { Authorization: `Bearer ${accessToken}` } });
      }

      setMsg('Housekeeping status updated successfully!');
      fetchRoomsAndFloors();
      setTimeout(() => setDrawerOpen(false), 800);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Update failed.');
    }
  };

  const handleLogMaintenance = async () => {
    try {
      setMsg('');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/api/maintenance/open`, {
        roomId: selectedRoom._id,
        issueType: maintenanceIssue,
        description: 'AC or appliance servicing needed',
        priority: maintenancePriority,
        hotelId: activeHotelId
      }, { headers: { Authorization: `Bearer ${accessToken}` } });

      setMsg('Maintenance ticket logged. Room locked.');
      fetchRoomsAndFloors();
      setTimeout(() => setDrawerOpen(false), 1000);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Lock failed.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
      case 'Occupied': return 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)';
      case 'Reserved': return 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
      case 'Maintenance': return 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
      case 'Cleaning': return 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)';
      default: return '#64748b';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>Interactive Floor Matrix</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Track current occupancy, housekeeping duties, and active repair tickets.</Typography>
        </Box>
      </Box>

      {/* Legend Block */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        {['Available', 'Occupied', 'Reserved', 'Maintenance', 'Cleaning'].map((st) => (
          <Chip
            key={st}
            label={st}
            sx={{
              background: getStatusColor(st),
              color: '#fff',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 1,
            }}
          />
        ))}
      </Box>

      {/* Floor Sections */}
      {floors.map((floor) => {
        const floorRooms = rooms.filter((r) => r.floorId?._id === floor._id);
        return (
          <Box key={floor._id} sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <span style={{ width: '4px', height: '24px', background: '#6366f1', display: 'inline-block', borderRadius: '2px' }} />
              {floor.name || `Floor ${floor.floorNumber}`}
            </Typography>
            <Grid container spacing={3}>
              {floorRooms.length > 0 ? (
                floorRooms.map((room) => (
                  <Grid item xs={12} sm={6} md={3} lg={2.4} key={room._id}>
                    <Card
                      onClick={() => handleRoomClick(room)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px rgba(0,0,0,0.15)' },
                        background: getStatusColor(room.status),
                        color: '#fff',
                        borderRadius: 3,
                      }}
                    >
                      <CardContent sx={{ position: 'relative', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>{room.roomNumber}</Typography>
                          <Badge
                            badgeContent={room.housekeepingStatus}
                            color={room.housekeepingStatus === 'Clean' ? 'success' : 'error'}
                            sx={{ '& .MuiBadge-badge': { fontWeight: 'bold', fontSize: '0.65rem', px: 1, py: 0.5 } }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ opacity: 0.85, fontWeight: 600 }}>{room.categoryId?.name}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>INR {room.categoryId?.basePrice}/night</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', pl: 2 }}>No rooms configured on this floor.</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      })}

      {/* Room Drawer Operations */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: 400, p: 4, bgcolor: 'background.default' } }}>
        {selectedRoom && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Room {selectedRoom.roomNumber}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Category: {selectedRoom.categoryId?.name} | Price: INR {selectedRoom.categoryId?.basePrice}</Typography>
            </Box>

            {msg && <Alert severity={msg.includes('success') || msg.includes('logged') ? 'success' : 'error'} sx={{ borderRadius: 2 }}>{msg}</Alert>}

            <Divider />

            {/* Housekeeping status updates */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RotateCw size={18} color="#6366f1" /> Housekeeping Status
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Cleaning Status</InputLabel>
                <Select value={housekeepingStatus} onChange={(e) => setHousekeepingStatus(e.target.value)} label="Cleaning Status">
                  <MenuItem value="Dirty">Dirty</MenuItem>
                  <MenuItem value="Clean">Clean</MenuItem>
                  <MenuItem value="Inspected">Inspected</MenuItem>
                </Select>
              </FormControl>
              <Button onClick={handleUpdateHousekeeping} variant="contained" fullWidth startIcon={<CheckCircle size={16} />}>
                Save Cleaning Status
              </Button>
            </Box>

            <Divider />

            {/* Log Maintenance */}
            {selectedRoom.status !== 'Occupied' && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Hammer size={18} color="#ef4444" /> Maintenance Ticket
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Select Issue Type</InputLabel>
                  <Select value={maintenanceIssue} onChange={(e) => setMaintenanceIssue(e.target.value)} label="Select Issue Type">
                    <MenuItem value="AC Repair">AC Repair</MenuItem>
                    <MenuItem value="TV Repair">TV Repair</MenuItem>
                    <MenuItem value="Furniture Repair">Furniture Repair</MenuItem>
                    <MenuItem value="Plumbing">Plumbing</MenuItem>
                    <MenuItem value="Electrical">Electrical</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select value={maintenancePriority} onChange={(e) => setMaintenancePriority(e.target.value)} label="Priority">
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                  </Select>
                </FormControl>
                <Button onClick={handleLogMaintenance} variant="contained" color="secondary" fullWidth startIcon={<Hammer size={16} />}>
                  Lock Room & Log Repair
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
};
export default Rooms;
