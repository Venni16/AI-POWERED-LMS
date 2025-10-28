import express from 'express';
import { ChatMessage } from '../models/ChatMessage.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user can access course chat
const canAccessCourseChat = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check permissions based on role
    if (userRole === 'instructor') {
      // Instructor can only access their own courses
      if (course.instructor_id !== userId) {
        return res.status(403).json({ error: 'You can only chat in courses you created' });
      }
    } else if (userRole === 'student') {
      // Student must be enrolled in the course
      const enrollment = await Enrollment.findByStudentAndCourse(userId, courseId);
      if (!enrollment) {
        return res.status(403).json({ error: 'You must be enrolled in this course to chat' });
      }
    } else {
      return res.status(403).json({ error: 'Invalid user role for chat access' });
    }

    req.course = course;
    next();
  } catch (error) {
    console.error('Error checking course chat access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get chat messages for a course
router.get('/courses/:courseId/messages', authenticate, canAccessCourseChat, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { limit = 50, after } = req.query;

    let messages;
    if (after) {
      messages = await ChatMessage.findByCourseAfter(courseId, after);
    } else {
      messages = await ChatMessage.findByCourse(courseId, parseInt(limit));
    }

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to course chat
router.post('/courses/:courseId/messages', authenticate, canAccessCourseChat, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    const chatMessage = await ChatMessage.create({
      courseId,
      senderId,
      message: message.trim()
    });

    // Emit to Socket.IO room
    const io = req.app.get('io');
    if (io) {
      io.to(`course_${courseId}`).emit('new_message', chatMessage);
    }

    res.status(201).json({ message: chatMessage });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get chat message count for a course
router.get('/courses/:courseId/messages/count', authenticate, canAccessCourseChat, async (req, res) => {
  try {
    const { courseId } = req.params;
    const count = await ChatMessage.countByCourse(courseId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching message count:', error);
    res.status(500).json({ error: 'Failed to fetch message count' });
  }
});

export default router;
