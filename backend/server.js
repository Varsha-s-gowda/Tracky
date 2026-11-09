const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { createRateLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const habitRoutes = require('./routes/habitRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const streakRoutes = require('./routes/streakRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const xpRoutes = require('./routes/xpRoutes');
const productivityRoutes = require('./routes/productivityRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const accountRoutes = require('./routes/accountRoutes');
const { seedAchievements } = require('./services/achievementService');
const aiProvider = require('./services/aiProviderService');

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

const globalLimiter = createRateLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  keyPrefix: 'global',
});
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax,
  keyPrefix: 'auth',
});
const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: env.aiRateLimitMax,
  keyPrefix: 'ai',
});

app.get('/api/health', (_req, res) => {
  const ai = aiProvider.getStatus();
  res.json({
    status: 'ok',
    service: 'tracky-ai-api',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai: { configured: ai.configured, provider: ai.provider, model: ai.model },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', globalLimiter);

app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/habits', authMiddleware, habitRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);
app.use('/api/streaks', authMiddleware, streakRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/achievements', authMiddleware, achievementRoutes);
app.use('/api/xp', authMiddleware, xpRoutes);
app.use('/api/productivity', authMiddleware, productivityRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/ai', authMiddleware, aiLimiter, aiRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/account', authMiddleware, accountRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    await seedAchievements();

    const server = app.listen(env.port, () => {
      console.log(`Tracky AI API running on http://localhost:${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start Tracky AI API:', error.message);
    process.exit(1);
  }
}

startServer();
