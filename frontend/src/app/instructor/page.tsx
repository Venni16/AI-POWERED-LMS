'use client';

import ProtectedRoute from '../../../components/common/ProtectedRoute';
import SidebarLayout from '../../../components/common/SidebarLayout';
import CourseManager from '../../../components/Instructor/CourseManager';
import VideoUploader from '../../../components/Instructor/VideoUploader';
import MaterialUploader from '../../../components/Instructor/MaterialUploader';
import StudentEnrollments from '../../../components/Instructor/StudentEnrollments';
import ChatManager from '../../../components/Instructor/ChatManager';
import McqManager from '../../../components/Instructor/McqManager';
import { useState, useEffect } from 'react';
import { instructorAPI } from '../../../lib/api';
import { BookOpen, Users, Video, UploadCloud, MessageSquare, HelpCircle, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, loading }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center space-x-4 shadow-sm">
    <div className="shrink-0 bg-gray-100 rounded-full p-3">
      <Icon className="h-6 w-6 text-black" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {loading ? '...' : value}
      </p>
    </div>
  </div>
);

const InstructorDashboardContent = ({ stats, loading }: { stats: any, loading: boolean }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1 }}
    className="space-y-8"
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Courses" value={stats.coursesCount} icon={BookOpen} loading={loading} />
      <StatCard title="Total Students" value={stats.totalStudents} icon={Users} loading={loading} />
      <StatCard title="Videos Uploaded" value={stats.videosCount} icon={Video} loading={loading} />
    </div>
    
    <h2 className="text-3xl font-bold text-gray-900 pt-4">Course Management</h2>
    <CourseManager />
  </motion.div>
);

const UploadContent = () => (
  <div className="space-y-6">
    <VideoUploader />
    <MaterialUploader />
  </div>
);

export default function InstructorDashboard() {
  const [stats, setStats] = useState({
    coursesCount: 0,
    totalStudents: 0,
    videosCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await instructorAPI.getStats();
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const instructorNavItems = [
    { id: 'dashboard', label: 'Dashboard & Courses', icon: LayoutDashboard, component: <InstructorDashboardContent stats={stats} loading={loading} /> },
    { id: 'upload', label: 'Upload Content', icon: UploadCloud, component: <UploadContent /> },
    { id: 'mcqs', label: 'Quiz Manager', icon: HelpCircle, component: <McqManager /> },
    { id: 'students', label: 'Student Enrollments', icon: Users, component: <StudentEnrollments /> },
    { id: 'chat', label: 'Live Chat', icon: MessageSquare, component: <ChatManager /> },
  ];

  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <SidebarLayout
        title="Instructor Hub"
        description="Manage your content, students, and engagement tools."
        navItems={instructorNavItems}
        defaultTab="dashboard"
      />
    </ProtectedRoute>
  );
}