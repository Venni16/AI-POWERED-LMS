'use client';

import { useState, useEffect } from 'react';
import { studentAPI } from '../../lib/api';
import { Course } from '../../types';
import Link from 'next/link';

export default function MyCourses({ showProgressOnly = false }: { showProgressOnly?: boolean }) {
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
    // Progress calculation based on student video progress data
    const totalVideos = course.videos?.length || 0;
    const watchedVideos = course.videos?.filter(video =>
      video.studentProgress && video.studentProgress.completed
    ).length || 0;
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
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          {showProgressOnly ? 'Learning Progress' : 'My Enrolled Courses'}
        </h3>

        {showProgressOnly ? (
          <div className="space-y-6">
            {courses.map((course) => {
              const progress = calculateProgress(course);
              const totalVideos = course.videos?.length || 0;
              const watchedVideos = course.videos?.filter(video =>
                video.studentProgress && video.studentProgress.completed
              ).length || 0;

              return (
                <div key={course.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-12 h-12 mr-4">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-xs text-gray-400">📚</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <p className="text-sm text-gray-600">{watchedVideos} of {totalVideos} lessons completed</p>
                  </div>
                  <div className="flex items-center space-x-4 ml-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
        )}

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