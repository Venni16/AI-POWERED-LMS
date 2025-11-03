'use client';

import { useState, useEffect } from 'react';
import { studentAPI } from '../../lib/api';
import { Course } from '../../types';
import Link from 'next/link';
import { BookOpen, Video, FileText, ArrowRight, Loader2, CheckCircle, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  delay: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white border border-gray-200 rounded-xl p-6 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="shrink-0 bg-gray-100 rounded-full p-3">
      <Icon className="h-6 w-6 text-black" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  </motion.div>
);

interface MyCoursesContentProps {
  showProgressOnly?: boolean;
  stats: {
    enrolledCourses: number;
    completedCourses: number;
    learningHours: number;
    achievements: number;
  };
  statsLoading: boolean;
}

export default function MyCoursesContent({ showProgressOnly = false, stats, statsLoading }: MyCoursesContentProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await studentAPI.getMyCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching my courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (course: Course) => {
    const totalVideos = course.videos?.length || 0;
    const watchedVideos = course.videos?.filter(video =>
      video.studentProgress && video.studentProgress.completed
    ).length || 0;
    return totalVideos > 0 ? (watchedVideos / totalVideos) * 100 : 0;
  };

  const renderLearningHours = () => {
    if (statsLoading) return '...';
    return stats.learningHours < 60 ? `${stats.learningHours} min` : `${(stats.learningHours / 60).toFixed(1)} hrs`;
  };

  const OverviewSection = () => (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Enrolled Courses" value={statsLoading ? '...' : stats.enrolledCourses} icon={BookOpen} delay={0.1} />
        <StatCard title="Completed Courses" value={statsLoading ? '...' : stats.completedCourses} icon={CheckCircle} delay={0.2} />
        <StatCard title="Total Learning Time" value={renderLearningHours()} icon={Clock} delay={0.3} />
        <StatCard title="Achievements Earned" value={statsLoading ? '...' : stats.achievements} icon={Award} delay={0.4} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <OverviewSection />
        <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      </div>
    );
  }

  if (showProgressOnly) {
    return (
      <div className="bg-white shadow-lg rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Learning Progress</h3>
        <div className="space-y-4">
          {courses.map((course) => {
            const progress = calculateProgress(course);
            const totalVideos = course.videos?.length || 0;
            const watchedVideos = course.videos?.filter(video =>
              video.studentProgress && video.studentProgress.completed
            ).length || 0;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-white transition-colors"
              >
                <div className="flex items-center flex-1 min-w-0 mb-3 sm:mb-0">
                  <div className="flex-shrink-0 w-12 h-12 mr-4">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{course.title}</h4>
                    <p className="text-sm text-gray-600">{watchedVideos} of {totalVideos} lessons completed</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-10 text-right">{Math.round(progress)}%</span>
                  <Link
                    href={`/student/courses/${course.slug || course.id}`}
                    className="text-black hover:text-gray-700 transition-colors shrink-0"
                    title="Continue Learning"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <OverviewSection />
      
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-6 py-5 sm:p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">My Enrolled Courses</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const progress = calculateProgress(course);

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                  className="border border-gray-200 rounded-xl overflow-hidden shadow-md transition-shadow bg-white"
                >
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h4>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>

                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4 border-t border-b py-3">
                      <span className="flex items-center">
                        <Video className="w-4 h-4 mr-1" />
                        {course.videos?.length || 0} videos
                      </span>
                      <span className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {course.materials?.length || 0} materials
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-5">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <Link
                      href={`/student/courses/${course.slug || course.id}`}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-2.5 px-4 rounded-lg text-sm font-medium text-center hover:bg-blue-600 transition-colors shadow-md"
                    >
                      <span>Continue Learning</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-xl font-medium">You haven't enrolled in any courses yet.</p>
              <p className="text-sm mt-2">
                <Link href="/student?tab=catalog" className="text-black hover:underline font-medium">
                  Browse the course catalog
                </Link>{' '}
                to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}