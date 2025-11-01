'use client';

import { useState, useEffect } from 'react';
import Chat from '../common/Chat';
import { instructorAPI, chatAPI } from '../../lib/api';
import { Course, User } from '../../types';
import { MessageSquare, Users, Loader2 } from 'lucide-react';

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

  const fetchCurrentUser = () => {
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
      const courseList = response.data.courses || [];
      setCourses(courseList);
      if (courseList.length > 0 && !selectedCourse) {
        setSelectedCourse(courseList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatStats = async () => {
    const stats: { [courseId: string]: number } = {};
    // Fetch stats for all courses concurrently (or in batches if many)
    const promises = courses.map(async (course) => {
      try {
        const response = await chatAPI.getMessages(course.id);
        stats[course.id] = response.data.messages?.length || 0;
      } catch (error) {
        stats[course.id] = 0;
      }
    });
    await Promise.all(promises);
    setChatStats(stats);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-black animate-spin mr-2" />
        <span className="text-gray-600">Loading courses and chat data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Course Chat Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Select a course to view and manage its real-time discussion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Course Selection Sidebar */}
        <div className="lg:col-span-1 border-r lg:pr-6 border-gray-100">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Your Courses</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {courses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No courses available. Create one first!
              </div>
            ) : (
              courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedCourse?.id === course.id
                      ? 'border-black bg-gray-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {course.title}
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {course.enrollmentCount}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          {chatStats[course.id] || 0}
                        </span>
                      </div>
                    </div>
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
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Live Chat: {selectedCourse.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCourse.enrollmentCount} enrolled students
                </p>
              </div>

              {currentUser ? (
                <Chat courseId={selectedCourse.id} currentUser={currentUser} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  User data not loaded. Cannot start chat.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200 h-full flex flex-col items-center justify-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Course Chat
              </h3>
              <p className="text-gray-600">
                Choose a course from the left panel to open its discussion forum.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}