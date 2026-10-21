import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initCronJobs } from './jobs/cronScheduler.js';

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  // Setup Socket.io for real-time notifications
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.clientUrl, `https://${config.apexDomain}`],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Make io accessible globally if needed
  app.set('io', io);

  // Initialize background cron jobs
  initCronJobs();

  httpServer.listen(config.port, () => {
    console.log(`🚀 PeopleInsight AI Backend running on port ${config.port} (${config.env})`);
    console.log(`🔗 Health check available at: http://localhost:${config.port}/health`);
  });
};

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
