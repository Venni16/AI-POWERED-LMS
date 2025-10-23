'use client';

import { useState, useEffect } from 'react';
import { studentAPI, coursesAPI } from '../../lib/api';
import { Course } from '../../types';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await studentAPI.getMyCourses();
      const enrolledIds = response.data.courses.map((course: Course) => course._id);
      setEnrolledCourses(enrolledIds);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await studentAPI.enrollCourse(courseId);
      setEnrolledCourses(prev => [...prev, courseId]);
      alert('Successfully enrolled in the course!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to enroll in course');
    }
  };

  const categories = Array.from(new Set(courses.map(course => course.category)));

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              Showing {filteredCourses.length} of {courses.length} courses
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Available Courses</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No thumbnail</span>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 flex-1">{course.title}</h4>
                    <span className="text-sm font-medium text-green-600 ml-2">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>{course.category}</span>
                    <span>{course.enrollmentCount} students</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
                      <span className="text-xs font-medium">
                        {course.instructor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{course.instructor.name}</span>
                  </div>

                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrolledCourses.includes(course._id)}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      enrolledCourses.includes(course._id)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {enrolledCourses.includes(course._id) ? 'Already Enrolled' : 'Enroll Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p>No courses found matching your criteria.</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}