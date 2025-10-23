import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs/promises';
import Video from '../models/Video.js';
import Course from '../models/Course.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp4', '.avi', '.mov', '.mkv', '.wmv'];
    const extname = allowedTypes.includes(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('video/');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (MP4, AVI, MOV, MKV, WMV)'));
    }
  }
});

// Process video with Python server
const processVideoWithAI = async (videoPath, videoId) => {
  try {
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
    
    // Read the video file
    const videoBuffer = await fs.readFile(videoPath);
    
    const formData = new FormData();
    const blob = new Blob([videoBuffer], { type: 'video/mp4' });
    formData.append('video', blob, `video-${videoId}.mp4`);

    console.log(`Sending video ${videoId} to Python server for processing...`);
    
    const response = await axios.post(`${pythonServerUrl}/process-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout
    });

    console.log(`Received AI processing results for video ${videoId}`);
    return response.data;
    
  } catch (error) {
    console.error('Error processing video with AI:', error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
};

// Upload and process video
router.post('/process', upload.single('video'), async (req, res) => {
  let videoPath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    videoPath = req.file.path;
    const { courseId, title } = req.body;

    console.log(`Processing video: ${videoPath} for course: ${courseId}`);

    // Create video record in database
    const video = new Video({
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      course: courseId,
      status: 'processing'
    });
    
    await video.save();

    // Process video with AI (in background)
    processVideoWithAI(videoPath, video._id)
      .then(async (result) => {
        try {
          // Update video with AI results
          video.transcript = result.transcript;
          video.summary = result.summary;
          video.editedSummary = result.summary;
          video.processingTime = result.processing_time;
          video.status = 'completed';
          await video.save();

          console.log(`Video ${video._id} processed successfully`);

          // Clean up uploaded file
          await fs.unlink(videoPath);
        } catch (updateError) {
          console.error('Error updating video after processing:', updateError);
          video.status = 'error';
          await video.save();
        }
      })
      .catch(async (error) => {
        console.error('Error in background processing:', error);
        video.status = 'error';
        await video.save();
      });

    // Return immediate response
    res.json({
      success: true,
      videoId: video._id,
      message: 'Video uploaded and processing started'
    });

  } catch (error) {
    console.error('Error in video upload:', error);
    
    // Clean up file on error
    if (videoPath) {
      try {
        await fs.unlink(videoPath);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'Failed to upload video',
      details: error.message
    });
  }
});

// Get video processing status
router.get('/:videoId/status', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({
      success: true,
      status: video.status,
      video: video
    });

  } catch (error) {
    console.error('Error getting video status:', error);
    res.status(500).json({ error: 'Failed to get video status' });
  }
});

// Use default export
export default router;