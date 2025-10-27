 import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { Video } from '../models/Video.js';

const router = express.Router();

// Debug route to check video files
router.get('/videos/:videoId/check', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found in database' });
    }

    const videoPath = path.join('uploads/videos', video.filename);
    
    // Check if file exists
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({ 
        error: 'Video file not found on disk',
        details: {
          expectedPath: videoPath,
          filename: video.filename
        }
      });
    }

    // Get file stats
    const stats = await fs.stat(videoPath);
    
    res.json({
      success: true,
      video: {
        _id: video._id,
        title: video.title,
        filename: video.filename,
        fileSize: video.fileSize,
        actualFileSize: stats.size,
        fileType: video.fileType,
        status: video.status,
        uploadDate: video.uploadDate
      },
      fileInfo: {
        path: videoPath,
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      }
    });

  } catch (error) {
    console.error('Debug video error:', error);
    res.status(500).json({ error: 'Debug error', details: error.message });
  }
});

// List all videos for debugging
router.get('/videos', async (req, res) => {
  try {
    const videos = await Video.find().sort({ uploadDate: -1 }).limit(10);
    
    const videosWithFileInfo = await Promise.all(
      videos.map(async (video) => {
        const videoPath = path.join('uploads/videos', video.filename);
        let fileExists = false;
        let fileSize = 0;
        
        try {
          const stats = await fs.stat(videoPath);
          fileExists = true;
          fileSize = stats.size;
        } catch {
          fileExists = false;
        }
        
        return {
          _id: video._id,
          title: video.title,
          filename: video.filename,
          dbFileSize: video.fileSize,
          actualFileSize: fileSize,
          fileExists,
          status: video.status,
          uploadDate: video.uploadDate
        };
      })
    );

    res.json({ success: true, videos: videosWithFileInfo });
  } catch (error) {
    console.error('Debug list videos error:', error);
    res.status(500).json({ error: 'Debug error', details: error.message });
  }
});

// Debug route to test login
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('=== DEBUG LOGIN TEST ===');
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    const { User } = await import('../models/User.js');
    const user = await User.findByEmail(email);

    console.log('User found:', user ? {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      isActive: user.is_active,
      role: user.role
    } : 'No user found');

    if (!user) {
      return res.json({ success: false, error: 'User not found' });
    }

    if (!user.password) {
      console.log('User has no password');
      return res.json({ success: false, error: 'No password set' });
    }

    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password verification result:', isValid);

    res.json({
      success: isValid,
      user: isValid ? {
        id: user.id,
        email: user.email,
        role: user.role
      } : null
    });

  } catch (error) {
    console.error('Debug login test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create test student user
router.post('/create-test-student', async (req, res) => {
  try {
    const { User } = await import('../models/User.js');
    const bcrypt = await import('bcryptjs');

    const testEmail = 'student@example.com';
    const testPassword = 'password123';

    // Check if user already exists
    const existingUser = await User.findByEmail(testEmail);
    if (existingUser) {
      return res.json({ success: false, error: 'Test student already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create test student
    const user = await User.create({
      name: 'Test Student',
      email: testEmail,
      password: hashedPassword,
      role: 'student'
    });

    console.log('Test student created:', user.id);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      credentials: {
        email: testEmail,
        password: testPassword
      }
    });

  } catch (error) {
    console.error('Create test student error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
