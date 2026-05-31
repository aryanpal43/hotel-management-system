const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables dynamically from root or local
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');
const { initSocketIO } = require('./services/notificationService');

// Master Models for seeder
const SubscriptionPlan = require('./models/SubscriptionPlan');
const User = require('./models/User');
const Hotel = require('./models/Hotel');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Database
connectDB();

// Create HTTP Server
const server = http.createServer(app);

// Setup Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configure Socket.IO Connections
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join a Room - Hotels are isolated in socket channels
  socket.on('join_hotel_channel', (hotelId) => {
    if (hotelId) {
      const roomName = `hotel_${hotelId}`;
      socket.join(roomName);
      console.log(`[Socket] Client ${socket.id} joined room channel: ${roomName}`);
    }
  });

  socket.on('join_admin_channel', () => {
    socket.join('global_admin');
    console.log(`[Socket] Client ${socket.id} joined global admin channel.`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Attach Socket Instance to Notification Service
initSocketIO(io);

// ==========================================
// AUTOMATED DATABASE SEEDER (PRO TOUCH)
// ==========================================
const seedDatabase = async () => {
  try {
    // 1. Seed Global Subscription Plans
    const planCount = await SubscriptionPlan.countDocuments();
    if (planCount === 0) {
      console.log('[Seeder] Seeding default SaaS Subscription Plans...');
      const plans = [
        {
          name: 'Starter',
          price: 2000,
          billingCycle: 'monthly',
          limits: { rooms: 20, users: 5, storageGb: 5, whatsappAlerts: 100 },
          features: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING'],
        },
        {
          name: 'Professional',
          price: 5000,
          billingCycle: 'monthly',
          limits: { rooms: 100, users: 20, storageGb: 20, whatsappAlerts: 500 },
          features: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY'],
        },
        {
          name: 'Enterprise',
          price: 12000,
          billingCycle: 'monthly',
          limits: { rooms: 9999, users: 999, storageGb: 100, whatsappAlerts: 9999 },
          features: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'],
        },
      ];
      await SubscriptionPlan.insertMany(plans);
      console.log('[Seeder] Subscription Plans seeded successfully.');
    }

    // 2. Seed Super Admin Profile
    const adminEmail = 'admin';
    const adminPassword = 'admin@123';
    const superAdminExists = await User.findOne({ email: adminEmail });
    if (!superAdminExists) {
      console.log(`[Seeder] Seeding default Super Admin User: ${adminEmail}...`);
      const superAdmin = new User({
        name: 'SaaS Super Admin',
        email: adminEmail,
        password: adminPassword,
        roles: ['SUPER_ADMIN'],
        hotelId: null,
      });
      await superAdmin.save();
      console.log('[Seeder] Super Admin profile seeded successfully.');
    }

    // 3. Seed Distributor Profile
    const distEmail = 'distributor@saas.com';
    const distPassword = 'distributor@123';
    const distExists = await User.findOne({ email: distEmail });
    if (!distExists) {
      console.log(`[Seeder] Seeding default Reseller Distributor: ${distEmail}...`);
      const distributor = new User({
        name: 'SaaS Partner Distributor',
        email: distEmail,
        password: distPassword,
        roles: ['DISTRIBUTOR'],
        allowedModules: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'POS', 'MAINTENANCE', 'INVENTORY'],
      });
      await distributor.save();
      console.log('[Seeder] Reseller Distributor profile seeded successfully.');
    }

    // 4. Seed Hotel & Hotel Admin
    const hotelAdminEmail = 'hoteladmin@saas.com';
    const hotelAdminPassword = 'hoteladmin@123';
    const hotelAdminExists = await User.findOne({ email: hotelAdminEmail });
    if (!hotelAdminExists) {
      console.log('[Seeder] Seeding default Hotel Admin & Hotel Tenant...');
      // Find Enterprise Plan to link
      const plan = await SubscriptionPlan.findOne({ name: 'Enterprise' });
      const planId = plan ? plan._id : null;
      
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 1); // 1 year expiry

      const hotel = new Hotel({
        name: 'Seeded Grand Plaza Resort',
        ownerName: 'Aryan Elite',
        email: 'grandplaza@saas.com',
        phone: '+919999999999',
        license: {
          planId,
          planName: 'Enterprise',
          startDate: new Date(),
          expiryDate: expiry,
          roomLimit: 100,
          userLimit: 20,
          whatsappLimit: 5000,
          features: ['RESERVATIONS', 'HOUSEKEEPING', 'ACCOUNTING', 'MAINTENANCE', 'INVENTORY', 'POS'],
        },
      });

      const savedHotel = await hotel.save();

      const hotelAdmin = new User({
        name: 'Grand Plaza Administrator',
        email: hotelAdminEmail,
        password: hotelAdminPassword,
        roles: ['HOTEL_ADMIN'],
        hotelId: savedHotel._id,
      });

      await hotelAdmin.save();
      console.log('[Seeder] Hotel Tenant and Hotel Admin profile seeded successfully.');
    }
  } catch (error) {
    console.error('[Seeder Error] Failed to run seeder:', error.message);
  }
};

// Execute Database Seeder
seedDatabase();

// Listen on configured PORT
server.listen(PORT, () => {
  console.log(`[Server] Hotel Cloud SaaS server listening on http://localhost:${PORT}`);
});
