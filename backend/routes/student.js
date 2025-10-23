import express from 'express';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('student'));

// Get all available courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructor', 'name profile')
      .select('-videos -materials -enrolledStudents')
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Enroll in a course
router.post('/courses/:courseId/enroll', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || !course.isPublished) {
      return res.status(404).json({ error: 'Course not found or not available' });
    }

    // Check if already enrolled
    const isEnrolled = course.enrolledStudents.some(
      enrollment => enrollment.student.toString() === req.user._id.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({ error: 'Already enrolled in this course' });
    }

    // Add to enrolled students
    course.enrolledStudents.push({
      student: req.user._id,
      enrolledAt: new Date()
    });

    course.enrollmentCount += 1;
    await course.save();

    await createAuditLog(req, 'ENROLL_COURSE', 'COURSE', { courseId: course._id });

    res.json({ success: true, message: 'Successfully enrolled in course' });

  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled courses
router.get('/my-courses', async (req, res) => {
  try {
    const courses = await Course.find({
      'enrolledStudents.student': req.user._id,
      isPublished: true
    })
      .populate('instructor', 'name profile')
      .populate('videos')
      .populate('materials')
      .sort({ createdAt: -1 });

    res.json({ success: true, courses });

  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course details (only if enrolled)
router.get('/courses/:courseId', async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      'enrolledStudents.student': req.user._id,
      isPublished: true
    })
      .populate('instructor', 'name profile')
      .populate('videos')
      .populate('materials');

    if (!course) {
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