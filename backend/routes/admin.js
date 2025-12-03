import express from 'express';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { AuditLog } from '../models/AuditLog.js';
import { supabase } from '../lib/supabase.js';
import { generateRevenueReportPdf } from '../utils/pdfGenerator.js';

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

    // Get user registration trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: userTrends, error: trendsError } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    if (trendsError) throw trendsError;

    // Process user trends data
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    userTrends.forEach(user => {
      const date = new Date(user.created_at);
      const month = months[date.getMonth()];

      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month]++;
    });

    const userTrendsData = months.map(month => ({
      month,
      users: monthlyData[month] || 0
    }));

    // Get course enrollment data
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        course_id,
        courses!inner(title)
      `);

    if (enrollmentsError) throw enrollmentsError;

    // Count enrollments per course
    const enrollmentCounts = {};
    enrollments.forEach(enrollment => {
      const courseId = enrollment.course_id;
      const courseTitle = enrollment.courses.title;
      if (!enrollmentCounts[courseId]) {
        enrollmentCounts[courseId] = { title: courseTitle, count: 0 };
      }
      enrollmentCounts[courseId].count++;
    });

    // Get top 5 courses by enrollment
    const courseEnrollmentsData = Object.values(enrollmentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => ({
        course: item.title,
        enrollments: item.count
      }));

    const recentLogs = await AuditLog.getRecent(10);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalInstructors,
        totalStudents,
        totalCourses
      },
      charts: {
        userTrends: userTrendsData,
        roleDistribution: [
          { name: 'Students', value: totalStudents, color: '#3B82F6' },
          { name: 'Instructors', value: totalInstructors, color: '#10B981' },
          { name: 'Admins', value: 1, color: '#8B5CF6' }
        ],
        courseEnrollments: courseEnrollmentsData
      },
      recentLogs
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get revenue report
router.get('/reports/revenue', async (req, res) => {
  try {
    // Fetch successful payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        amount,
        course:courses(id, title, price)
      `)
      .eq('status', 'succeeded');

    if (paymentsError) throw paymentsError;

    let totalRevenue = 0;
    const courseRevenueMap = {};

    payments.forEach(p => {
      totalRevenue += p.amount;
      const courseId = p.course.id;
      
      if (!courseRevenueMap[courseId]) {
        courseRevenueMap[courseId] = {
          title: p.course.title,
          purchases: 0,
          revenue: 0
        };
      }
      
      courseRevenueMap[courseId].purchases += 1;
      courseRevenueMap[courseId].revenue += p.amount;
    });

    const courseReports = Object.values(courseRevenueMap).sort((a, b) => b.revenue - a.revenue);

    res.json({
      success: true,
      totalRevenue: totalRevenue,
      courseReports: courseReports
    });

  } catch (error) {
    console.error('Admin revenue report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// NEW: Download Revenue Report as PDF
router.get('/reports/revenue/download-pdf', async (req, res) => {
  try {
    // 1. Fetch the raw report data (same logic as /reports/revenue)
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        amount,
        course:courses(id, title, price)
      `)
      .eq('status', 'succeeded');

    if (paymentsError) throw paymentsError;

    let totalRevenue = 0;
    const courseRevenueMap = {};

    payments.forEach(p => {
      totalRevenue += p.amount;
      const courseId = p.course.id;
      
      if (!courseRevenueMap[courseId]) {
        courseRevenueMap[courseId] = {
          title: p.course.title,
          purchases: 0,
          revenue: 0
        };
      }
      
      courseRevenueMap[courseId].purchases += 1;
      courseRevenueMap[courseId].revenue += p.amount;
    });

    const courseReports = Object.values(courseRevenueMap).sort((a, b) => b.revenue - a.revenue);

    const reportData = {
      totalRevenue: totalRevenue,
      courseReports: courseReports
    };

    // 2. Generate PDF
    const pdfStream = await generateRevenueReportPdf(reportData);

    // 3. Set headers and pipe stream
    const filename = `Vortex_Revenue_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    pdfStream.pipe(res);

    await createAuditLog(req, 'DOWNLOAD_REVENUE_REPORT', 'REPORT', { format: 'PDF' });

  } catch (error) {
    console.error('Admin PDF report download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
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
      createdAt: user.created_at,
      profile: {
        bio: user.bio,
        avatar: user.avatar_url,
        specialization: user.specialization
      }
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

// Delete user
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    await User.delete(req.params.userId);

    await createAuditLog(req, 'DELETE_USER', 'USER', {
      userId: user.id, email: user.email, role: user.role
    });

    res.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
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