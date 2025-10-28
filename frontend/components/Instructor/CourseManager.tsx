'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { instructorAPI } from '../../lib/api';
import { Course, Video } from '../../types';
import VideoPlayer from '../common/VideoPlayer';

export default function CourseManager() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingSummary, setEditingSummary] = useState<{videoId: string, summary: string} | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '0',
    thumbnail: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  // Add polling for video processing updates
  useEffect(() => {
    const hasProcessingVideos = courses.some(course =>
      course.videos?.some(video => video.status === 'processing')
    );

    if (hasProcessingVideos) {
      const interval = setInterval(() => {
        fetchCourses();
      }, 3000); // Poll every 3 seconds for faster updates

      return () => clearInterval(interval);
    }
  }, [courses]);

  // Also poll continuously if we're on the instructor page (more aggressive polling)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCourses();
    }, 10000); // Poll every 10 seconds as backup

    return () => clearInterval(interval);
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      if (error.response?.status === 403) {
        alert('Access denied. You do not have instructor permissions.');
        // Redirect to student dashboard or home
        router.push('/');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await instructorAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

 // Update the handleCreateCourse function
const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine the category value
    const categoryValue = formData.category === 'new' ? newCategoryInput.trim() : formData.category;

    // Validate required fields
    if (!formData.title.trim() || !formData.description.trim() || !categoryValue) {
      alert('Title, description, and category are required');
      return;
    }

    try {
      const response = await instructorAPI.createCourse({
        ...formData,
        category: categoryValue,
        price: parseFloat(formData.price) || 0
      });

      if (response.data.success) {
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          price: '0',
          thumbnail: ''
        });
        setNewCategoryInput('');
        fetchCourses();
        alert('Course created successfully!');
      } else {
        alert(response.data.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Create course error:', error);
      alert(error.response?.data?.error || 'Failed to create course');
    }
  };

  const toggleCoursePublish = async (courseId: string, isPublished: boolean) => {
    try {
      await instructorAPI.updateCourse(courseId, { isPublished: !isPublished });
      fetchCourses();
      alert('Course status updated!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update course');
    }
  };

  const handleDeleteVideo = async (courseId: string, videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await instructorAPI.deleteVideo(courseId, videoId);
      fetchCourses();
      alert('Video deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete video');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will permanently delete all videos, materials, and course data. This action cannot be undone.')) {
      return;
    }

    try {
      await instructorAPI.deleteCourse(courseId);
      fetchCourses();
      alert('Course deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete course');
    }
  };

  const handleEditSummary = (video: Video) => {
    setEditingSummary({
      videoId: video.id,
      summary: video.editedSummary || video.summary
    });
  };

  const handleSaveSummary = async (courseId: string) => {
    if (!editingSummary) return;

    try {
      await instructorAPI.updateVideoSummary(courseId, editingSummary.videoId, editingSummary.summary);
      setEditingSummary(null);
      fetchCourses();
      alert('Summary updated successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update summary');
    }
  };

  const handleCancelEdit = () => {
    setEditingSummary(null);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Course Form - same as before */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Course</h3>
<form onSubmit={handleCreateCourse} className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700">Course Title *</label>
      <input
        type="text"
        required
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter course title"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Category *</label>
      <select
        required
        value={formData.category}
        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a category</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
        <option value="new">+ Add New Category</option>
      </select>
      {formData.category === 'new' && (
        <input
          type="text"
          placeholder="Enter new category"
          value={newCategoryInput}
          onChange={(e) => setNewCategoryInput(e.target.value)}
          className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      )}
    </div>
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700">Description *</label>
      <textarea
        required
        rows={3}
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="Describe what students will learn in this course"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Price ($)</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={formData.price}
        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
      <input
        type="url"
        value={formData.thumbnail}
        onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="https://example.com/image.jpg"
      />
    </div>
  </div>
  <div className="flex space-x-3">
    <button
      type="submit"
      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      Create Course
    </button>
    <button
      type="button"
      onClick={() => setShowCreateForm(false)}
      className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
    >
      Cancel
    </button>
  </div>
</form>
        </div>
      )}

      {/* Courses List with Enhanced Video Management */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">My Courses</h3>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Course
            </button>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                {/* Course Thumbnail */}
                <div className="relative h-48 bg-gray-100">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-3">{course.description}</p>
                  </div>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {course.category}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      ${course.price}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {course.enrollmentCount || 0} students
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {course.videos?.length || 0} videos
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/instructor/courses/${course.id}`)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleCoursePublish(course.id, course.isPublished)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          course.isPublished
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Delete Course
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {courses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-6xl mb-4">📚</div>
              <p>No courses created yet.</p>
              <p className="text-sm">Create your first course to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}