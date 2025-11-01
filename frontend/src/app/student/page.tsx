'use client';

import ProtectedRoute from '../../../components/common/ProtectedRoute';
import SidebarLayout from '../../../components/common/SidebarLayout';
import CourseCatalog from '../../../components/student/CourseCatalog';
import MyCoursesContent from '../../../components/student/MyCourses';
import { useState, useEffect } from 'react';
import { studentAPI } from '../../../lib/api';
import { BookOpen, CheckCircle, Clock, Award, LayoutDashboard, Search } from 'lucide-react';

export default function StudentDashboard() {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    learningHours: 0,
    achievements: 7
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await studentAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const studentNavItems = [
    { 
      id: 'my-courses', 
      label: 'My Courses & Overview', 
      icon: BookOpen, 
      component: <MyCoursesContent stats={stats} statsLoading={loading} /> 
    },
    { 
      id: 'progress', 
      label: 'Progress Tracker', 
      icon: CheckCircle, 
      component: <MyCoursesContent showProgressOnly={true} stats={stats} statsLoading={loading} /> 
    },
    { id: 'catalog', label: 'Course Catalog', icon: Search, component: <CourseCatalog /> },
  ];

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <SidebarLayout
        title="My Learning Journey"
        description="Welcome back! Track your progress and discover new courses."
        navItems={studentNavItems}
        defaultTab="my-courses"
      />
    </ProtectedRoute>
  );
}