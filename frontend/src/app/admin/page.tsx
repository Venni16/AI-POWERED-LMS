'use client';

import ProtectedRoute from '../../../components/common/ProtectedRoute';
import SidebarLayout from '../../../components/common/SidebarLayout';
import UserManagement from '../../../components/Admin/UserManagement';
import AuditLogs from '../../../components/Admin/AuditLogs';
import PasswordChanger from '../../../components/Admin/PasswordChanger';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../lib/api';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Users, BookOpen, UserCheck, FileText, LayoutDashboard, Key } from 'lucide-react';

// Define a consistent monochrome color palette for charts
const CHART_COLORS = ['#000000', '#333333', '#666666', '#999999'];

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, loading, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 flex items-center space-x-4"
  >
    <div className="shrink-0 bg-gray-100 rounded-full p-3">
      <Icon className="h-6 w-6 text-black" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {loading ? '...' : value}
      </p>
    </div>
  </motion.div>
);

const DashboardContent = ({ stats, loading, chartData }: { stats: any, loading: boolean, chartData: any }) => (
  <motion.div
    className="space-y-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Total Users" value={stats.totalUsers} icon={Users} loading={loading} delay={0.1} />
      <StatCard title="Courses" value={stats.totalCourses} icon={BookOpen} loading={loading} delay={0.2} />
      <StatCard title="Instructors" value={stats.totalInstructors} icon={UserCheck} loading={loading} delay={0.3} />
      <StatCard title="Audit Logs" value="View Details" icon={FileText} loading={loading} delay={0.4} />
    </div>

    {/* Charts Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Trends Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registration Trends (Last 6 Months)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData.userTrends} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#374151" />
            <YAxis stroke="#374151" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Line type="monotone" dataKey="users" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Role Distribution Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData.roleDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.roleDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ paddingLeft: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Course Enrollments Chart (Improved Bar Chart) */}
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Course Enrollments</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData.courseEnrollments} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis type="number" stroke="#374151" />
          <YAxis type="category" dataKey="course" stroke="#374151" width={100} />
          <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
          <Bar dataKey="enrollments" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);


export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalCourses: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    userTrends: { month: string; users: number }[];
    roleDistribution: { name: string; value: number; color: string }[];
    courseEnrollments: { course: string; enrollments: number }[];
  }>({
    userTrends: [],
    roleDistribution: [],
    courseEnrollments: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboard();
        const roleDistributionData = response.data.charts.roleDistribution.map((item: any, index: number) => ({
          ...item,
          color: CHART_COLORS[index % CHART_COLORS.length]
        }));

        setStats(response.data.stats);
        setChartData({
          ...response.data.charts,
          roleDistribution: roleDistributionData
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, component: <DashboardContent stats={stats} loading={loading} chartData={chartData} /> },
    { id: 'users', label: 'User Management', icon: Users, component: <UserManagement /> },
    { id: 'passwords', label: 'Change Passwords', icon: Key, component: <PasswordChanger /> },
    { id: 'audit', label: 'Audit Logs', icon: FileText, component: <AuditLogs /> },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <SidebarLayout
        title="Admin Panel"
        description="Centralized administration and system monitoring."
        navItems={adminNavItems}
        defaultTab="dashboard"
      />
    </ProtectedRoute>
  );
}