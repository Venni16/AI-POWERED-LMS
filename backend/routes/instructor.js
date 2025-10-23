import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs/promises';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import Course from '../models/Course.js';
import Video from '../models/Video.js';
import Material from '../models/Material.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({ 
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const materialUpload = multer({ 
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Background video processing function
const processVideoInBackground = async (videoId, videoPath) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
    
    // Read the video file
    const videoBuffer = await fs.readFile(videoPath);
    
    const formData = new FormData();
    const blob = new Blob([videoBuffer], { type: video.fileType });
    formData.append('video', blob, video.filename);

    console.log(`Processing video ${videoId} with AI...`);
    
    const response = await axios.post(`${pythonServerUrl}/process-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout
    });

    // Update video with AI results
    video.transcript = response.data.transcript;
    video.summary = response.data.summary;
    video.editedSummary = response.data.summary;
    video.processingTime = response.data.processing_time;
    video.status = 'completed';
    await video.save();

    console.log(`Video ${videoId} processed successfully`);

    // Clean up uploaded file
    await fs.unlink(videoPath);

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    
    // Update video status to error
    const video = await Video.findById(videoId);
    if (video) {
      video.status = 'error';
      await video.save();
    }
  }
};

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('instructor'));

// Get instructor courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .populate('videos')
      .populate('materials')
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create course
router.post('/courses', async (req, res) => {
    try {
      const { title, description, category, price, thumbnail } = req.body;
  
      // Validate required fields
      if (!title || !description || !category) {
        return res.status(400).json({ 
          error: 'Title, description, and category are required' 
        });
      }
  
      const course = new Course({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        price: price ? parseFloat(price) : 0,
        thumbnail: thumbnail || '',
        instructor: req.user._id
      });
  
      await course.save();
      
      await createAuditLog(req, 'CREATE_COURSE', 'COURSE', { 
        courseId: course._id,
        title: course.title
      });
  
      res.status(201).json({ 
        success: true, 
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          category: course.category,
          price: course.price,
          thumbnail: course.thumbnail,
          instructor: req.user._id,
          isPublished: course.isPublished,
          enrollmentCount: course.enrollmentCount,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        }
      });
  
    } catch (error) {
      console.error('Create course error:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ error: errors.join(', ') });
      }
      
      res.status(500).json({ error: 'Server error' });
    }
  });

// Update course
router.put('/courses/:courseId', async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.courseId, instructor: req.user._id },
      req.body,
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await createAuditLog(req, 'UPDATE_COURSE', 'COURSE', { courseId: course._id });

    res.json({ success: true, course });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload video to course
router.post('/courses/:courseId/videos', videoUpload.single('video'), async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.courseId, 
      instructor: req.user._id 
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const video = new Video({
      title: req.body.title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      course: course._id,
      status: 'processing'
    });

    await video.save();

    // Add video to course
    course.videos.push(video._id);
    await course.save();

    await createAuditLog(req, 'UPLOAD_VIDEO', 'VIDEO', { 
      courseId: course._id, videoId: video._id 
    });

    // Process video with AI in background
    processVideoInBackground(video._id, req.file.path);

    res.status(201).json({ 
      success: true, 
      video: video,
      message: 'Video uploaded. AI processing started...' 
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload material to course
router.post('/courses/:courseId/materials', materialUpload.single('material'), async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.courseId, 
      instructor: req.user._id 
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const material = new Material({
      title: req.body.title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      course: course._id
    });

    await material.save();

    course.materials.push(material._id);
    await course.save();

    await createAuditLog(req, 'UPLOAD_MATERIAL', 'MATERIAL', { 
      courseId: course._id, materialId: material._id 
    });

    res.status(201).json({ success: true, material });

  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled students for a course
router.get('/courses/:courseId/students', async (req, res) => {
  try {
    const course = await Course.findOne({ 
      _id: req.params.courseId, 
      instructor: req.user._id 
    }).populate('enrolledStudents.student', 'name email');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ success: true, students: course.enrolledStudents });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete video from course
router.delete('/courses/:courseId/videos/:videoId', async (req, res) => {
    try {
      const course = await Course.findOne({ 
        _id: req.params.courseId, 
        instructor: req.user._id 
      });
  
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      const video = await Video.findOne({
        _id: req.params.videoId,
        course: req.params.courseId
      });
  
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
  
      // Remove video from course
      course.videos = course.videos.filter(vid => vid.toString() !== req.params.videoId);
      await course.save();
  
      // Delete video file from uploads
      const videoPath = path.join('uploads/videos', video.filename);
      try {
        await fs.unlink(videoPath);
      } catch (fileError) {
        console.error('Error deleting video file:', fileError);
      }
  
      // Delete video record from database
      await Video.findByIdAndDelete(req.params.videoId);
  
      await createAuditLog(req, 'DELETE_VIDEO', 'VIDEO', { 
        courseId: course._id, videoId: video._id 
      });
  
      res.json({ 
        success: true, 
        message: 'Video deleted successfully' 
      });
  
    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// Update video summary
router.put('/courses/:courseId/videos/:videoId/summary', async (req, res) => {
    try {
      const course = await Course.findOne({ 
        _id: req.params.courseId, 
        instructor: req.user._id 
      });
  
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }
  
      const video = await Video.findOne({
        _id: req.params.videoId,
        course: req.params.courseId
      });
  
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
  
      const { summary } = req.body;
      
      if (!summary) {
        return res.status(400).json({ error: 'Summary is required' });
      }
  
      video.editedSummary = summary;
      await video.save();
  
      await createAuditLog(req, 'UPDATE_SUMMARY', 'VIDEO', { 
        courseId: course._id, videoId: video._id 
      });
  
      res.json({ 
        success: true, 
        video: video 
      });
  
    } catch (error) {
      console.error('Update summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
// Use default export
export default router;