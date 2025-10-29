import express from 'express';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('admin'));

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalInstructors = await User.findByRole('instructor').then(users => users.length);
    const totalStudents = await User.findByRole('student').then(users => users.length);
    const totalCourses = await Course.count();
    
    const recentLogs = await AuditLog.getRecent(10);

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
    const users = await User.findAll();
    // Transform snake_case fields to camelCase for frontend
    const transformedUsers = users.map(user => ({
      ...user,
      isActive: user.is_active,
      createdAt: user.created_at
    }));
    res.json({ success: true, users: transformedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create instructor account
router.post('/users/instructor', async (req, res) => {
  try {
    const { name, email, password, specialization } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const instructor = await User.create({
      name,
      email,
      password,
      role: 'instructor',
      specialization
    });

    await createAuditLog(req, 'CREATE_INSTRUCTOR', 'USER', {
      instructorId: instructor.id, email
    });

    res.status(201).json({
      success: true,
      user: {
        id: instructor.id,
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
    const user = await User.update(req.params.userId, { is_active: isActive });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await createAuditLog(req, 'UPDATE_USER_STATUS', 'USER', {
      userId: user.id, isActive
    });

    res.json({ success: true, user });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change instructor password
router.patch('/users/:userId/password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'instructor') {
      return res.status(403).json({ error: 'Can only change password for instructor accounts' });
    }

    await User.updatePassword(req.params.userId, password);

    await createAuditLog(req, 'CHANGE_INSTRUCTOR_PASSWORD', 'USER', {
      userId: user.id, email: user.email
    });

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Change password error:', error);
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

    const result = await AuditLog.getPaginated(page, limit, filter);
    const logs = result.logs;
    const total = result.total;

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