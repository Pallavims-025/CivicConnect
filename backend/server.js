import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { prisma } from './lib/prisma.js';
import { ensureConfiguredAdmin, hasAdminConfig } from './lib/adminBootstrap.js';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function isLocalDevelopmentOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:') return false;
    const host = url.hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '::1'].includes(host)) return true;
    const octets = host.split('.').map(Number);
    if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    return octets[0] === 10
      || (octets[0] === 192 && octets[1] === 168)
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31);
  } catch {
    return false;
  }
}

if (hasAdminConfig()) {
  let result = {};
  try {
    result = await ensureConfiguredAdmin(prisma);
  } catch (err) {
    console.warn('[CivicConnect Backend] Database unavailable at startup. Server running with fallback handlers until MySQL is online.');
  }
  if (result.created) console.log('[CivicConnect Backend] Configured administrator account initialized.');
  else if (result.repaired) console.log('[CivicConnect Backend] Configured administrator account password initialized.');
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (CLIENT_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      if (isLocalDevelopmentOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '45mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads/supervisor-avatars', express.static(fileURLToPath(new URL('./uploads/supervisor-avatars/', import.meta.url)), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1h',
}));
app.use('/uploads/admin-avatars', express.static(fileURLToPath(new URL('./uploads/admin-avatars/', import.meta.url)), {
  dotfiles: 'deny',
  index: false,
  maxAge: '1h',
}));

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
