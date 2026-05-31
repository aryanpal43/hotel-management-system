const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Routes & Middleware
const apiRouter = require('./routes/api');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Config CORS - support cross-origin requests from React dashboard
const allowedOrigins = [
  'http://localhost:5173',
  'https://hotel-management-system-one.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin === process.env.FRONTEND_URL) {
        return callback(null, true);
      }
      return callback(null, new Error('CORS Not Allowed'));
    },
    credentials: true,
  })
);

// Logging middleware
app.use(morgan('dev'));

// Payload Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static logo assets if required
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount Centralized SaaS API Router
app.use('/api', apiRouter);

// Base route for health checking
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Hotel Cloud SaaS Enterprise Server API is operating normally.',
    timestamp: new Date(),
  });
});

// Centralized Error Handling Middlewares
app.use(errorHandler);

module.exports = app;
