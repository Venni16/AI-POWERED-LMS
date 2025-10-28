'use client';

import { useState, useEffect } from 'react';
import Chat from '../common/Chat';
import { instructorAPI, chatAPI } from '../../lib/api';
import { Course, User } from '../../types';

export default function ChatManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatStats, setChatStats] = useState<{ [courseId: string]: number }>({});

  useEffect(() => {
    fetchCourses();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchChatStats();
    }
  }, [courses]);

  const fetchCurrentUser = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatStats = async () => {
    try {
      const stats: { [courseId: string]: number } = {};
      for (const course of courses) {
        try {
          const response = await chatAPI.getMessages(course.id);
          stats[course.id] = response.data.messages?.length || 0;
        } catch (error) {
          stats[course.id] = 0;
        }
      }
      setChatStats(stats);
    } catch (error) {
      console.error('Failed to fetch chat stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="text-center text-gray-500">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Course Chat Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select a course to view and manage its chat
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Course Selection */}
        <div className="lg:col-span-1">
          <h3 className="text-md font-medium text-gray-900 mb-4">Your Courses</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {courses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No courses available
              </div>
            ) : (
              courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedCourse?.id === course.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.category} • {course.enrollmentCount} students
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {chatStats[course.id] || 0} messages
                        </span>
                      </div>
                    </div>
                    {selectedCourse?.id === course.id && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          {selectedCourse ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900">
                  Chat for: {selectedCourse.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCourse.enrollmentCount} enrolled students • {chatStats[selectedCourse.id] || 0} messages
                </p>
              </div>

              {currentUser && (
                <Chat courseId={selectedCourse.id} currentUser={currentUser} />
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Course
              </h3>
              <p className="text-gray-600">
                Choose a course from the list to view and manage its chat
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
