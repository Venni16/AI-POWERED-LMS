import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Import routes with default imports
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import instructorRoutes from './routes/instructor.js';
import studentRoutes from './routes/student.js';
import coursesRoutes from './routes/courses.js';
import videoRoutes from './routes/video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-lms';

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.40.1:3000'],
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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/video', videoRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AI LMS API is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
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

// Initialize default admin user
const initializeAdmin = async () => {
  const User = (await import('./models/User.js')).default;
  
  const adminExists = await User.findOne({ role: 'admin' });
  if (!adminExists) {
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@lms.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();
    console.log('Default admin user created: admin@lms.com / admin123');
  }
};

// Initialize server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Ensure upload directories
    await ensureUploadDirs();
    
    // Initialize default admin
    await initializeAdmin();
    
    app.listen(PORT, () => {
      console.log(`AI LMS Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();