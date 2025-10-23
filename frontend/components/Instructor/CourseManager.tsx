'use client';

import { useState, useEffect } from 'react';
import { instructorAPI } from '../../lib/api';
import { Course, Video } from '../../types';

export default function CourseManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingSummary, setEditingSummary] = useState<{videoId: string, summary: string} | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '0',
    thumbnail: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

 // Update the handleCreateCourse function
const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim()) {
      alert('Title, description, and category are required');
      return;
    }
  
    try {
      const response = await instructorAPI.createCourse({
        ...formData,
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

  const handleEditSummary = (video: Video) => {
    setEditingSummary({
      videoId: video._id,
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
          // In the create course form, add better validation
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
      <input
        type="text"
        required
        value={formData.category}
        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder="e.g., Programming, Design, Business"
      />
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

          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course._id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{course.title}</h4>
                    <p className="text-gray-600 mt-1">{course.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>Category: {course.category}</span>
                      <span>•</span>
                      <span>Price: ${course.price}</span>
                      <span>•</span>
                      <span>Students: {course.enrollmentCount}</span>
                      <span>•</span>
                      <span>Videos: {course.videos?.length || 0}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCoursePublish(course._id, course.isPublished)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      course.isPublished
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {course.isPublished ? 'Published' : 'Draft'}
                  </button>
                </div>

                {/* Videos Section */}
                <div className="mt-6">
                  <h5 className="text-lg font-medium text-gray-900 mb-3">Course Videos</h5>
                  
                  {course.videos && course.videos.length > 0 ? (
                    <div className="space-y-4">
                      {course.videos.map((video) => (
                        <div key={video._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h6 className="font-medium text-gray-900">{video.title}</h6>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                <span>Status: 
                                  <span className={`ml-1 ${
                                    video.status === 'completed' ? 'text-green-600' :
                                    video.status === 'processing' ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {video.status}
                                  </span>
                                </span>
                                <span>•</span>
                                <span>Size: {(video.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                                <span>•</span>
                                <span>Processing: {video.processingTime?.toFixed(2)}s</span>
                              </div>

                              {/* Video Player */}
                              {video.status === 'completed' && (
                                <div className="mt-3">
                                  <div className="bg-black rounded-lg overflow-hidden max-w-md">
                                    <video
                                      src={`http://localhost:5000/uploads/videos/${video.filename}`}
                                      controls
                                      className="w-full h-48 object-contain"
                                    >
                                      Your browser does not support the video tag.
                                    </video>
                                  </div>
                                </div>
                              )}

                              {/* Summary Section */}
                              {video.status === 'completed' && (
                                <div className="mt-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <h6 className="font-medium text-gray-900">AI Summary</h6>
                                    <button
                                      onClick={() => handleEditSummary(video)}
                                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                    >
                                      Edit Summary
                                    </button>
                                  </div>
                                  
                                  {editingSummary?.videoId === video._id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={editingSummary.summary}
                                        onChange={(e) => setEditingSummary(prev => 
                                          prev ? {...prev, summary: e.target.value} : null
                                        )}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Edit the summary..."
                                      />
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleSaveSummary(course._id)}
                                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                      <p className="text-gray-800 text-sm leading-relaxed">
                                        {video.editedSummary || video.summary}
                                      </p>
                                      {video.editedSummary !== video.summary && (
                                        <div className="mt-2 text-xs text-blue-600">
                                          ✓ Edited
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Delete Button */}
                            <div className="ml-4">
                              <button
                                onClick={() => handleDeleteVideo(course._id, video._id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">🎬</div>
                      <p>No videos uploaded yet.</p>
                      <p className="text-sm">Upload videos to get AI-generated summaries.</p>
                    </div>
                  )}
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