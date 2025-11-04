import express from 'express';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { User } from '../models/User.js';
import { Mcq } from '../models/Mcq.js';

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
      slug: course.slug,
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

    // Check if courseId is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.courseId);
    let course;

    if (isUUID) {
      // Check if user is enrolled in the course
      const { Enrollment } = await import('../models/Enrollment.js');
      const enrollment = await Enrollment.findByStudentAndCourse(req.user.id, req.params.courseId);

      if (!enrollment) {
        return res.status(404).json({ error: 'Course not found or access denied' });
      }

      course = await Course.findById(req.params.courseId);
    } else {
      // It's a slug, find by slug
      course = await Course.findBySlug(req.params.courseId);

      // Check if user is enrolled in the course
      const { Enrollment } = await import('../models/Enrollment.js');
      const enrollment = await Enrollment.findByStudentAndCourse(req.user.id, course.id);

      if (!enrollment) {
        return res.status(404).json({ error: 'Course not found or access denied' });
      }
    }

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

// Get MCQs for course (only if enrolled)
router.get('/courses/:courseId/mcqs', async (req, res) => {
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

    const mcqs = await Mcq.findByCourseId(req.params.courseId);

    // Get quiz attempt information
    const { QuizAttempt } = await import('../models/QuizAttempt.js');
    const attempts = await QuizAttempt.findByStudentAndCourse(req.user.id, req.params.courseId);
    const attemptCount = attempts.length;
    const canRetake = attemptCount < 3;

    // Transform MCQs to hide correct answer for students
    const transformedMcqs = mcqs.map(mcq => ({
      id: mcq.id,
      course_id: mcq.course_id,
      question: mcq.question,
      option1: mcq.option1,
      option2: mcq.option2,
      option3: mcq.option3,
      option4: mcq.option4,
      option5: mcq.option5,
      created_at: mcq.created_at
      // Note: correct_option is intentionally excluded for students
    }));

    res.json({
      success: true,
      mcqs: transformedMcqs,
      quizInfo: {
        attemptCount: attemptCount,
        maxAttempts: 3,
        canRetake: canRetake,
        attemptsRemaining: Math.max(0, 3 - attemptCount),
        lastAttempt: attempts.length > 0 ? attempts[0] : null
      }
    });

  } catch (error) {
    console.error('Get MCQs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit MCQ answers for course
router.post('/courses/:courseId/mcqs/submit', async (req, res) => {
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

    const { answers } = req.body; // Expected format: { mcqId: selectedOption, ... }

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers must be provided as an object' });
    }

    // Get all MCQs for the course
    const mcqs = await Mcq.findByCourseId(req.params.courseId);

    let correctCount = 0;
    let totalCount = mcqs.length;
    const results = [];

    for (const mcq of mcqs) {
      const studentAnswer = answers[mcq.id];
      const isCorrect = studentAnswer && parseInt(studentAnswer) === mcq.correct_option;

      if (isCorrect) {
        correctCount++;
      }

      results.push({
        mcqId: mcq.id,
        question: mcq.question,
        studentAnswer: studentAnswer || null,
        correctAnswer: mcq.correct_option,
        isCorrect: isCorrect
      });
    }

    const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

    // Check current attempt count
    const { QuizAttempt } = await import('../models/QuizAttempt.js');
    const currentAttempts = await QuizAttempt.countAttemptsByStudentAndCourse(req.user.id, req.params.courseId);

    if (currentAttempts >= 3) {
      return res.status(400).json({ error: 'Maximum quiz attempts (3) reached for this course' });
    }

    // Record this attempt
    const attemptNumber = currentAttempts + 1;
    const attempt = await QuizAttempt.create({
      studentId: req.user.id,
      courseId: req.params.courseId,
      attemptNumber: attemptNumber,
      score: Math.round(score),
      totalQuestions: totalCount,
      correctAnswers: correctCount
    });

    // Award achievement if student gets full marks
    let achievement = null;
    if (score === 100 && totalCount > 0) {
      // Get course details for achievement description
      const course = await Course.findById(req.params.courseId);

      // Create achievement record
      const { Achievement } = await import('../models/Achievement.js');
      achievement = await Achievement.create({
        studentId: req.user.id,
        courseId: req.params.courseId,
        type: 'QUIZ_PERFECT',
        title: 'Perfect Quiz Score',
        description: `Achieved 100% on ${course.title} quiz`
      });
    }

    res.json({
      success: true,
      results: {
        totalQuestions: totalCount,
        correctAnswers: correctCount,
        score: Math.round(score),
        details: results,
        achievement: achievement,
        attemptNumber: attemptNumber,
        attemptsRemaining: Math.max(0, 3 - attemptNumber)
      }
    });

  } catch (error) {
    console.error('Submit MCQ answers error:', error);
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

    // Get actual achievement count
    const { Achievement } = await import('../models/Achievement.js');
    const achievementCount = await Achievement.countByStudent(req.user.id);

    const stats = {
      enrolledCourses: enrolledCoursesCount,
      completedCourses: completedCoursesCount,
      learningHours: totalLearningHours,
      achievements: achievementCount
    };

    res.json({ success: true, stats });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get course recommendations for student
router.get('/recommendations', async (req, res) => {
  try {
    // Validate user ID
    if (!req.user.id || req.user.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const recommendations = await Course.getRecommendationsForStudent(req.user.id);

    res.json({ success: true, recommendations });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Use default export
export default router;
