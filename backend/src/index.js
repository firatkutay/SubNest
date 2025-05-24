/**
 * Main entry point for the Subnest backend API
 * 
 * This file initializes the Express server, connects to the database,
 * sets up middleware, and registers all routes.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const db = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const billRoutes = require('./routes/bill.routes');
const categoryRoutes = require('./routes/category.routes');
const budgetRoutes = require('./routes/budget.routes');
const notificationRoutes = require('./routes/notification.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const transactionRoutes = require('./routes/transaction.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
db.connect()
  .then(() => {
    logger.info('Connected to database');
  })
  .catch((err) => {
    logger.error('Database connection error:', err);
    process.exit(1);
  });

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Subnest API',
      version: '1.0.0',
      description: 'API for Subnest subscription and bill management application',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://api.subnest.app/v1',
        description: 'Production server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } })); // HTTP request logging

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 429,
    message: 'Too many requests, please try again later.',
  },
});

// Apply rate limiter to all requests
app.use(limiter);

// API Routes
const apiRouter = express.Router();
app.use('/api/v1', apiRouter);

// Swagger documentation
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Register routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/bills', billRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/user-categories', categoryRoutes);
apiRouter.use('/budgets', budgetRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/recommendations', recommendationRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/admin', adminRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app; // For testing
