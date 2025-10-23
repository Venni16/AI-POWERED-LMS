import express from 'express';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalInstructors = await User.countDocuments({ role: 'instructor' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    
    const recentLogs = await AuditLog.find()
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalInstructors,
        totalStudents,
        totalCourses
      },
      recentLogs
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create instructor account
router.post('/users/instructor', async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const instructor = new User({
      name,
      email,
      password,
      role: 'instructor',
      profile: { specialization }
    });

    await instructor.save();

    await createAuditLog(req, 'CREATE_INSTRUCTOR', 'USER', { 
      instructorId: instructor._id, email 
    });

    res.status(201).json({
      success: true,
      user: {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role,
        profile: instructor.profile
      }
    });

  } catch (error) {
    console.error('Create instructor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await createAuditLog(req, 'UPDATE_USER_STATUS', 'USER', { 
      userId: user._id, isActive 
    });

    res.json({ success: true, user });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, action, resource } = req.query;
    
    const filter = {};
    if (action) filter.action = action;
    if (resource) filter.resource = resource;

    const logs = await AuditLog.find(filter)
      .populate('user', 'name email role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Use default export instead of named export
export default router;