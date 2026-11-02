import { prisma } from '../lib/prisma.js';

/**
 * Health check handler for GET /api/health
 * Accurately verifies server status and database connectivity.
 */
export async function getHealth(req, res) {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    // Attempt a lightweight ping query with a 3-second timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database ping timed out')), 3000)
      ),
    ]);
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
    // Sanitize error message to avoid leaking database connection strings / credentials
    dbError = err.code ? `DB Error (${err.code})` : 'Database connection unavailable';
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'connected';

  const payload = {
    status: isHealthy ? 'ok' : 'degraded',
    server: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs,
    ...(dbError && { databaseNotice: dbError }),
  };

  // Return HTTP 200 if connected, or HTTP 503 if database check failed
  return res.status(isHealthy ? 200 : 503).json(payload);
}
