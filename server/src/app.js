const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { errorHandler } = require('./middleware/errorHandler');
const v1Routes = require('./routes/v1/index');
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./utils/swagger');

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const app = express();

// Security
app.use(helmet());

// Cookie parser - required for refresh token cookies
app.use(cookieParser());

// CORS
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger docs
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API v1 routes
app.use('/api/v1', v1Routes);

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;
