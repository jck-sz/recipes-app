require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

const app = express();

// Import middleware
const { requestId, requestLogger, errorLogger } = require('./middleware/logging');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import route modules
const recipesRouter = require('./routes/recipes');
const categoriesRouter = require('./routes/categories');
const ingredientsRouter = require('./routes/ingredients');
const tagsRouter = require('./routes/tags');
const healthRouter = require('./routes/health');

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Request ID and logging
app.use(requestId);
app.use(requestLogger());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the FODMAP Recipe API!',
    version: '1.0.0',
    endpoints: {
      recipes: '/recipes',
      categories: '/categories',
      ingredients: '/ingredients',
      tags: '/tags'
    }
  });
});

// API routes
app.use('/health', healthRouter);
app.use('/recipes', recipesRouter);
app.use('/categories', categoriesRouter);
app.use('/ingredients', ingredientsRouter);
app.use('/tags', tagsRouter);

// Error handling middleware
app.use(errorLogger);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}`);
});
