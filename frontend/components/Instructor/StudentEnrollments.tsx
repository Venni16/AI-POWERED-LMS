'use client';

import { useState, useEffect } from 'react';
import { instructorAPI } from '../../lib/api';
import { Course, Enrollment } from '../../types';
import { Users, TrendingUp, Award, Clock } from 'lucide-react';

export default function StudentEnrollments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse);
    } else if (courses.length > 0) {
      setSelectedCourse(courses[0].id);
    }
  }, [selectedCourse, courses]);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchEnrollments = async (courseId: string) => {
    setLoading(true);
    try {
      const response = await instructorAPI.getEnrolledStudents(courseId);
      setEnrollments(response.data.students);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'N/A';
    }
  };

  const EnrollmentStatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center space-x-3">
      <Icon className="w-6 h-6 text-black" />
      <div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    </div>
  );

  const totalEnrolled = enrollments.length;
  const activeStudents = enrollments.filter(e => (e.progress || 0) > 0).length;
  const avgProgress = totalEnrolled > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / totalEnrolled)
    : 0;
  const totalAchievements = enrollments.reduce((sum, e) => sum + (e.achievements || 0), 0);
  const bestQuizScore = totalEnrolled > 0
    ? Math.max(...enrollments.map(e => e.bestQuizScore || 0))
    : 0;

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="px-6 py-5 sm:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <h3 className="text-xl font-semibold text-gray-900">Student Enrollments</h3>
          
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow w-full md:w-auto"
          >
            {courses.length === 0 && <option value="">No Courses Available</option>}
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.enrollmentCount} students)
              </option>
            ))}
          </select>
        </div>

        {selectedCourse && (
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-5 gap-4">
            <EnrollmentStatCard title="Total Enrolled" value={totalEnrolled} icon={Users} />
            <EnrollmentStatCard title="Active Students" value={activeStudents} icon={TrendingUp} />
            <EnrollmentStatCard title="Average Progress" value={`${avgProgress}%`} icon={Clock} />
            <EnrollmentStatCard title="Total Achievements" value={totalAchievements} icon={Award} />
            <EnrollmentStatCard title="Best Quiz Score" value={`${bestQuizScore}%`} icon={Award} />
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto"></div>
            <p className="text-gray-600 mt-3">Loading enrollments...</p>
          </div>
        ) : (
          <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Quiz Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {enrollment.student.avatar_url ? (
                            <img
                              src={enrollment.student.avatar_url}
                              alt={enrollment.student.name}
                              className="h-10 w-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                              {enrollment.student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.student.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {enrollment.student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(enrollment.enrolledAt || enrollment.enrolled_at || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-black h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {enrollment.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                      {enrollment.bestQuizScore || 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {enrollments.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-lg font-medium">No students enrolled in this course yet.</p>
                <p className="text-sm">Students will appear here once they enroll.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}