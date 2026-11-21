import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (origin === CLIENT_ORIGIN) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CivicConnect Backend API Server',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Direct health check aliases
app.use('/api', apiRoutes);
app.get('/health', (req, res) => res.redirect('/api/health'));

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`[CivicConnect Backend] Server is running on http://localhost:${PORT}`);
  console.log(`[CivicConnect Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[CivicConnect Backend] Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n[CivicConnect Backend] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('[CivicConnect Backend] Prisma client disconnected.');
    } catch (err) {
      console.error('[CivicConnect Backend] Error disconnecting Prisma client:', err);
    }
    process.exit(0);
  });

  // Force shutdown after 10s if graceful fails
  setTimeout(() => {
    console.error('[CivicConnect Backend] Forceful shutdown initiated.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
