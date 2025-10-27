'use client';

import { useState, useEffect } from 'react';
import { studentAPI } from '../../lib/api';
import { Course } from '../../types';
import Link from 'next/link';

export default function MyCourses() {
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
    // Simple progress calculation based on videos watched
    const totalVideos = course.videos?.length || 0;
    const watchedVideos = Math.floor(totalVideos * 0.3); // Mock data
    return totalVideos > 0 ? (watchedVideos / totalVideos) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">My Enrolled Courses</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const progress = calculateProgress(course);
            
            return (
              <div key={course.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No thumbnail</span>
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{course.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>{course.videos?.length || 0} videos</span>
                    <span>{course.materials?.length || 0} materials</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/student/courses/${course.id}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">📚</div>
            <p>You haven't enrolled in any courses yet.</p>
            <p className="text-sm">
              <Link href="/student?tab=catalog" className="text-blue-600 hover:text-blue-500">
                Browse the course catalog
              </Link>{' '}
              to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}