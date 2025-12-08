import app from './app';
import logger from './config/logger';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
  logger.info(`Health check available at: http://localhost:${PORT}/health`);
  logger.info(`API documentation available at: http://localhost:${PORT}/api-docs`);
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

export default server;
