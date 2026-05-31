const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Routes & Middleware
const apiRouter = require('./routes/api');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Config CORS - support cross-origin requests from React dashboard
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
