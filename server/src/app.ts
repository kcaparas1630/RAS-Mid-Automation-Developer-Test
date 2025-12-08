import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import helmet from 'helmet';

// Import configurations
import logger, { morganStream } from './config/logger';
import passport from './config/passport';
import { swaggerSpec } from './config/swagger';

// Import middlewares
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import {
  apiLimiter,
  authLimiter,
  securityHeaders,
} from './middlewares/security';

// Load environment variables
dotenv.config();

const app: Application = express();

// Trust proxy (important for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// Helmet for additional security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9)
  })
);

// HTTP request logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Passport middleware
app.use(passport.initialize());

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Documentation',
  })
);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Import routes
import invoiceRoutes from './routes/invoice.routes';
import csvRoutes from './routes/csv.routes';

// API routes
app.use('/api', apiLimiter);
// app.use('/api/auth', authLimiter); // Apply stricter limits to auth routes
// app.use('/api/v1', routes); // Your API routes will go here

// Invoice routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/csv-export', csvRoutes);

// Swagger JSON endpoint
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
