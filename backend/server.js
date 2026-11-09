const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const habitRoutes = require('./routes/habitRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
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

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tracky-ai-api',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/habits', authMiddleware, habitRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/calendar', authMiddleware, calendarRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();

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
