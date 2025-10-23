import express from 'express';
import Course from '../models/Course.js';
import Video from '../models/Video.js'; // Add this import
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Public route - get all published courses
router.get('/public', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name profile')
      .select('-videos -materials -enrolledStudents')
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });

  } catch (error) {
    console.error('Get public courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public route - get course details (without protected content)
router.get('/public/:courseId', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      isPublished: true
    })
      .populate('instructor', 'name profile')
      .select('-videos -materials -enrolledStudents');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ success: true, course });

  } catch (error) {
    console.error('Get public course details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get video file (public access for enrolled students)
router.get('/:courseId/videos/:videoId/file', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      isPublished: true
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

    // Check if user is enrolled (you might want to add proper authentication here)
    // For now, we'll allow access if the course is published
    
    const videoPath = path.join('uploads/videos', video.filename);
    
    // Check if file exists
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({ error: 'Video file not found' });
    }

    // Stream the video file
    res.sendFile(path.resolve(videoPath));

  } catch (error) {
    console.error('Get video file error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;