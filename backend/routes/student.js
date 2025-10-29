import express from 'express';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('student'));

// Get all available courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findPublished();

    res.json({ success: true, courses });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Enroll in a course
router.post('/courses/:courseId/enroll', async (req, res) => {
  try {
    // Validate user ID and course ID
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (!req.params.courseId || req.params.courseId === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course || !course.is_published) {
      return res.status(404).json({ error: 'Course not found or not available' });
    }

    // Check if already enrolled - using Supabase enrollment table
    const { Enrollment } = await import('../models/Enrollment.js');
    const existingEnrollment = await Enrollment.findByStudentAndCourse(req.user.id, req.params.courseId);

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Create enrollment
    await Enrollment.create({
      studentId: req.user.id,
      courseId: req.params.courseId
    });

    // Update course enrollment count
    await Course.update(req.params.courseId, { enrollmentCount: course.enrollment_count + 1 });

    await createAuditLog(req, 'ENROLL_COURSE', 'COURSE', { courseId: req.params.courseId });

    res.json({ success: true, message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled courses
router.get('/my-courses', async (req, res) => {
  try {
    const courses = await Course.findEnrolledByStudent(req.user.id);

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
      videos: course.videos?.map(video => ({
        ...video,
        uploadDate: video.created_at
      })) || [],
      materials: course.materials || []
    }));

    res.json({ success: true, courses: transformedCourses });

  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course details (only if enrolled)
router.get('/courses/:courseId', async (req, res) => {
  try {
    // Validate user ID and course ID
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (!req.params.courseId || req.params.courseId === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // Check if user is enrolled in the course
    const { Enrollment } = await import('../models/Enrollment.js');
    const enrollment = await Enrollment.findByStudentAndCourse(req.user.id, req.params.courseId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    const course = await Course.findById(req.params.courseId);

    if (!course || !course.is_published) {
      return res.status(404).json({ error: 'Course not found or access denied' });
    }

    // Transform course to match frontend expectations
    const transformedCourse = {
      ...course,
      videos: course.videos?.map(video => ({
        ...video,
        uploadDate: video.created_at
      })) || []
    };

    res.json({ success: true, course: transformedCourse });

  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark video as completed
router.post('/courses/:courseId/videos/:videoId/complete', async (req, res) => {
  try {
    // Validate user ID and course ID
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (!req.params.courseId || req.params.courseId === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }
    if (!req.params.videoId || req.params.videoId === 'undefined') {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    // Check if user is enrolled in the course
    const { Enrollment } = await import('../models/Enrollment.js');
    const enrollment = await Enrollment.findByStudentAndCourse(req.user.id, req.params.courseId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found or access denied' });
    }

    // Check if video belongs to the course
    const { Video } = await import('../models/Video.js');
    const video = await Video.findById(req.params.videoId);

    if (!video || video.course_id !== req.params.courseId) {
      return res.status(404).json({ error: 'Video not found in this course' });
    }

    // Mark video as completed
    const { StudentVideoProgress } = await import('../models/StudentVideoProgress.js');
    const progress = await StudentVideoProgress.upsert(
      req.user.id,
      req.params.videoId,
      req.params.courseId,
      true
    );

    res.json({ success: true, progress });

  } catch (error) {
    console.error('Mark video complete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course progress for student
router.get('/courses/:courseId/progress', async (req, res) => {
  try {
    // Validate user ID and course ID
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (!req.params.courseId || req.params.courseId === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    // Check if user is enrolled in the course
    const { Enrollment } = await import('../models/Enrollment.js');
    const enrollment = await Enrollment.findByStudentAndCourse(req.user.id, req.params.courseId);

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found or access denied' });
    }

    // Get progress data
    const { StudentVideoProgress } = await import('../models/StudentVideoProgress.js');
    const progressData = await StudentVideoProgress.findByStudentAndCourse(req.user.id, req.params.courseId);

    // Get total videos in course
    const course = await Course.findById(req.params.courseId);
    const totalVideos = course.videos?.length || 0;
    const completedVideos = progressData.filter(p => p.completed).length;

    const progress = {
      totalVideos,
      completedVideos,
      percentage: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0,
      videos: progressData
    };

    res.json({ success: true, progress });

  } catch (error) {
    console.error('Get course progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get student dashboard stats
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Validate user ID
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get enrolled courses count
    const enrolledCourses = await Course.findEnrolledByStudent(req.user.id);
    const enrolledCoursesCount = enrolledCourses.length;

    // Get completed courses count (courses where all videos are completed)
    let completedCoursesCount = 0;
    let totalLearningHours = 0;

    for (const course of enrolledCourses) {
      const { StudentVideoProgress } = await import('../models/StudentVideoProgress.js');
      const progressData = await StudentVideoProgress.findByStudentAndCourse(req.user.id, course.id);
      const totalVideos = course.videos?.length || 0;
      const completedVideos = progressData.filter(p => p.completed).length;

      if (totalVideos > 0 && completedVideos === totalVideos) {
        completedCoursesCount++;
      }

      // Calculate learning hours: total video length (10 min per video) + 10 min per material
      totalLearningHours += (totalVideos * 10) + ((course.materials?.length || 0) * 10);
    }

    const stats = {
      enrolledCourses: enrolledCoursesCount,
      completedCourses: completedCoursesCount,
      learningHours: totalLearningHours,
      achievements: 7 // Static for now as requested
    };

    res.json({ success: true, stats });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Use default export
export default router;
