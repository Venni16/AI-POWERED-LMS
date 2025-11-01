'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { instructorAPI } from '../../lib/api';
import { Course, Video } from '../../types';
import { BookOpen, Users, DollarSign, Trash2, Edit, Check, X, Loader2, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/useToast';

export default function CourseManager() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingSummary, setEditingSummary] = useState<{videoId: string, summary: string} | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '0',
    thumbnail: ''
  });
  const { showSuccess, showError } = useToast();

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
        showError('Access denied. You do not have instructor permissions.');
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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const categoryValue = formData.category === 'new' ? newCategoryInput.trim() : formData.category;

    if (!formData.title.trim() || !formData.description.trim() || !categoryValue) {
      showError('Title, description, and category are required');
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
        showSuccess('Course created successfully!');
      } else {
        showError(response.data.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Create course error:', error);
      showError(error.response?.data?.error || 'Failed to create course');
    }
  };

  const toggleCoursePublish = async (courseId: string, isPublished: boolean) => {
    try {
      await instructorAPI.updateCourse(courseId, { isPublished: !isPublished });
      fetchCourses();
      showSuccess(`Course status updated! It is now ${!isPublished ? 'Published' : 'Draft'}.`);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to update course status');
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await instructorAPI.deleteCourse(courseToDelete);
      fetchCourses();
      showSuccess('Course deleted successfully!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to delete course');
    } finally {
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
    }
  };

  const cancelDeleteCourse = () => {
    setShowDeleteConfirm(false);
    setCourseToDelete(null);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="loading-spinner mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
            onClick={cancelDeleteCourse}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this course? This will permanently delete all videos, materials, and course data. This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDeleteCourse}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCourse}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Course Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Course</h3>
          <form onSubmit={handleCreateCourse} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow bg-white"
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
                    placeholder="Enter new category name"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    className="mt-3 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                  />
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                  placeholder="Describe what students will learn in this course"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
              >
                Create Course
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Courses List Header */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-semibold text-gray-900">My Courses ({courses.length})</h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md shrink-0"
          >
            + Create New Course
          </button>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
            className="bg-white border border-gray-200 rounded-xl shadow-lg transition-shadow duration-300 overflow-hidden"
          >
            {/* Course Thumbnail */}
            <div className="relative h-48 bg-gray-100">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                  <BookOpen className="w-12 h-12" />
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                  course.isPublished
                    ? 'bg-green-500 text-white'
                    : 'bg-yellow-500 text-white'
                }`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            {/* Course Content */}
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-3">{course.description}</p>

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 border-t border-b py-3">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-black" />
                  <span>{course.enrollmentCount || 0} students</span>
                </div>
                <div className="flex items-center">
                  <VideoIcon className="w-4 h-4 mr-2 text-black" />
                  <span>{course.videos?.length || 0} videos</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-black" />
                  <span>{course.price === 0 ? 'Free' : `$${course.price}`}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-black" />
                  <span className="capitalize">{course.category}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3 pt-2">
                <button
                  onClick={() => router.push(`/instructor/courses/${course.id}`)}
                  className="w-full bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
                >
                  Manage Content
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => toggleCoursePublish(course.id, course.isPublished)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      course.isPublished
                        ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {courses.length === 0 && !showCreateForm && (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg mt-8 border border-gray-200">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-medium text-gray-700">No courses created yet.</p>
          <p className="text-sm text-gray-500 mt-2">Click "Create New Course" to get started!</p>
        </div>
      )}
    </div>
  );
}