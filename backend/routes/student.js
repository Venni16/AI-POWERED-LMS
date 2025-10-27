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
      videos: course.videos || [],
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

    res.json({ success: true, course });

  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Use default export
export default router;