'use client';

import { useState, useEffect } from 'react';
import { studentAPI, coursesAPI } from '../../lib/api';
import { Course } from '../../types';
import { Search, Filter, Users, DollarSign, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../../lib/useToast';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isEnrolling, setIsEnrolling] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getPublicCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      showError('Failed to load course catalog.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await studentAPI.getMyCourses();
      const enrolledIds = response.data.courses.map((course: Course) => course.id);
      setEnrolledCourses(enrolledIds);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    setIsEnrolling(courseId);
    try {
      await studentAPI.enrollCourse(courseId);
      setEnrolledCourses(prev => [...prev, courseId]);
      showSuccess('Successfully enrolled in the course!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(null);
    }
  };

  const categories = Array.from(new Set(courses.map(course => course.category))).filter(Boolean);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Course Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
              className="pl-9 pr-4 block w-full border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-9 pr-4 block w-full border border-gray-300 rounded-lg py-2 focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center text-sm text-gray-600 md:justify-end">
            Showing <span className="font-bold text-black mx-1">{filteredCourses.length}</span> of <span className="font-bold text-black mx-1">{courses.length}</span> available courses
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="px-6 py-5 sm:p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Course Catalog</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledCourses.includes(course.id);
              const enrolling = isEnrolling === course.id;

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
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 flex-1 line-clamp-2">{course.title}</h4>
                      <span className="text-sm font-bold text-black ml-2 shrink-0">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">{course.description}</p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-4 border-t border-b py-3">
                      <span className="flex items-center capitalize">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {course.category}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {course.enrollmentCount} students
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {course.price === 0 ? 'Free' : 'Paid'}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                        {course.instructor.avatar_url ? (
                          <img
                            src={course.instructor.avatar_url}
                            alt={course.instructor.name}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              const img = e.currentTarget;
                              const fallback = img.nextElementSibling as HTMLElement;
                              if (img && fallback) {
                                img.style.display = 'none';
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 ${
                            course.instructor.avatar_url ? 'hidden' : ''
                          }`}
                        >
                          {course.instructor.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <span className="font-medium text-gray-700">{course.instructor.name}</span>
                    </div>

                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={isEnrolled || enrolling}
                      className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center justify-center space-x-2 ${
                        isEnrolled
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-800'
                      }`}
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Enrolling...</span>
                        </>
                      ) : isEnrolled ? (
                        'Already Enrolled'
                      ) : (
                        'Enroll Now'
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl font-medium">No courses found matching your criteria.</p>
              <p className="text-sm mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}