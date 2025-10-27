import express from 'express';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth.js'; // Add authentication

const router = express.Router();

// Public route - get all published courses
router.get('/public', async (req, res) => {
  try {
    const courses = await Course.findPublished();

    // Transform courses to match frontend expectations (camelCase)
    const transformedCourses = courses.map(course => ({
      ...course,
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      thumbnailUrl: course.thumbnail_url,
      isPublished: course.is_published,
      enrollmentCount: course.enrollment_count,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      instructor: course.instructor,
      videos: course.videos || [],
      materials: course.materials || []
    }));

    res.json({ success: true, courses: transformedCourses });

  } catch (error) {
    console.error('Get public courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public route - get course details (without protected content)
router.get('/public/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || !course.is_published) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ success: true, course });

  } catch (error) {
    console.error('Get public course details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get video file - protected route for enrolled students
router.get('/:courseId/videos/:videoId/file', authenticate, async (req, res) => {
  try {
    // Check if user is enrolled in the course
    const { Enrollment } = await import('../models/Enrollment.js');
    const enrollment = await Enrollment.findByStudentAndCourse(req.user.id, req.params.courseId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const video = await Video.findById(req.params.videoId);

    if (!video || video.course_id !== req.params.courseId) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join('uploads/videos', video.filename);

    // Check if file exists
    try {
      await fs.access(videoPath);
    } catch {
      return res.status(404).json({ error: 'Video file not found' });
    }

    // Set proper headers for video streaming
    const stat = await fs.stat(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = await fs.open(videoPath, 'r');
      const stream = file.createReadStream({ start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.fileType || 'video/mp4',
      };

      res.writeHead(206, head);
      stream.pipe(res);
    } else {
      // Full video request
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.fileType || 'video/mp4',
      };

      res.writeHead(200, head);
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
    }

  } catch (error) {
    console.error('Get video file error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;