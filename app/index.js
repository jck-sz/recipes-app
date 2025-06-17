require('dotenv').config();

// Validate environment variables before starting the application
const { validateEnvOrExit } = require('./utils/envValidation');
validateEnvOrExit();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Import middleware
const { requestId, requestLogger, errorLogger } = require('./middleware/logging');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter, strictLimiter } = require('./middleware/rateLimiting');
const { generalSanitization } = require('./middleware/inputSanitization');

// Import all route modules
const recipesRouter = require('./routes/recipes');
const categoriesRouter = require('./routes/categories');
const ingredientsRouter = require('./routes/ingredients');
const tagsRouter = require('./routes/tags');
const healthRouter = require('./routes/health');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Compression middleware
app.use(compression());

// Request ID middleware
app.use(requestId);

// Rate limiting middleware
app.use(generalLimiter);
app.use(strictLimiter);

// Request logging middleware
app.use(requestLogger());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(generalSanitization);

// Add a root route
app.get('/', (_, res) => {
  res.json({ message: 'Welcome to the Recipe API!' });
});

// Register all routes
app.use('/recipes', recipesRouter);
app.use('/categories', categoriesRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/tags', tagsRouter);
app.use('/health', healthRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorLogger);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
let server;

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    if (server) {
      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err);
          process.exit(1);
        }
        console.log('HTTP server closed.');

        // Close database connections
        const { closePool } = require('./db');
        closePool().then(() => {
          process.exit(0);
        }).catch((err) => {
          console.error('Error during database shutdown:', err);
          process.exit(1);
        });
      });
    } else {
      process.exit(0);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
  });
}

// Export app for testing
module.exports = app;
