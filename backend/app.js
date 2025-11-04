import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { supabase } from './lib/supabase.js';

// Import routes with default imports
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import instructorRoutes from './routes/instructor.js';
import studentRoutes from './routes/student.js';
import coursesRoutes from './routes/courses.js';
import videoRoutes from './routes/video.js';
import debugRoutes from './routes/debug.js';
import chatRoutes from './routes/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL ||'http://localhost:3000', 'http://192.168.40.1:3000'],
    credentials: true
  }
});
const PORT = process.env.PORT || 5000;

// Get URLs from environment
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(helmet());
app.use(cors({
  origin: [FRONTEND_URL, 'http://192.168.40.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = ['uploads', 'uploads/videos', 'uploads/materials'];
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
};

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/chat', chatRoutes);

// Health check route

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AI LMS API is running',
    database: 'Connected to Supabase'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'AI LMS Backend API',
    endpoints: {
      health: '/health',
      videoSummarize: '/api/video/summarize',
      getVideos: '/api/video/videos'
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join course room
  socket.on('join_course', (courseId) => {
    socket.join(`course_${courseId}`);
    console.log(`User ${socket.id} joined course ${courseId}`);
  });

  // Leave course room
  socket.on('leave_course', (courseId) => {
    socket.leave(`course_${courseId}`);
    console.log(`User ${socket.id} left course ${courseId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize default admin user
const initializeAdmin = async () => {
  const { User } = await import('./models/User.js');

  const admins = await User.findByRole('admin');
  if (admins.length === 0) {
    await User.create({
      name: 'System Administrator',
      email: 'admin@lms.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Default admin user created: admin@lms.com / admin123');
  }
};

// Initialize server
const startServer = async () => {
  try {
    // Check Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    console.log('Connected to Supabase');

    // Ensure upload directories
    await ensureUploadDirs();

    // Initialize default admin
    await initializeAdmin();

    server.listen(PORT, () => {
      console.log(`AI LMS Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();