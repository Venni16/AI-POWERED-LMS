'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../../components/common/ProtectedRoute';
import VideoPlayer from '../../../../../components/common/VideoPlayer';
import Chat from '../../../../../components/common/Chat';
import { instructorAPI } from '../../../../../lib/api';
import { Course, Video, User } from '../../../../../types';
import { BookOpen, Video as VideoIcon, FileText, MessageSquare, Edit, Trash2, Loader2, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../../../../lib/useToast';

export default function InstructorCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingSummary, setEditingSummary] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{ type: 'video' | 'material'; id: string; name: string } | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (courseId && typeof courseId === 'string') {
      fetchCourseDetails();
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [courseId]);

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

  const fetchCourseDetails = async () => {
    try {
      const response = await instructorAPI.getCourseDetails(courseId as string);
      const fetchedCourse = response.data.course;
      setCourse(fetchedCourse);
      
      // Set active video: keep current active, or set to first if none
      if (!activeVideo && fetchedCourse.videos?.length > 0) {
        setActiveVideo(fetchedCourse.videos[0]);
      } else if (activeVideo) {
        // Update active video details if it's still in the list (e.g., status changed)
        const updatedActive = fetchedCourse.videos?.find((v: Video) => v.id === activeVideo.id);
        if (updatedActive) setActiveVideo(updatedActive);
      }

    } catch (error: any) {
      console.error('Error fetching course details:', error);
      if (error.response?.status === 400) {
        showError('Bad request - invalid course ID or ownership');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoExpansion = (videoId: string) => {
    setExpandedVideo(expandedVideo === videoId ? null : videoId);
  };

  const handleEditSummary = (videoId: string) => {
    const video = course?.videos?.find(v => v.id === videoId);
    if (video) {
      setEditingSummary(videoId);
      setSummaryText(video.editedSummary || video.summary || '');
    }
  };

  const handleSaveSummary = async (videoId: string) => {
    try {
      await instructorAPI.updateVideoSummary(courseId as string, videoId, summaryText);
      // Refresh course details to get updated summary
      await fetchCourseDetails();
      setEditingSummary(null);
      setSummaryText('');
      showSuccess('Summary updated successfully!');
    } catch (error) {
      console.error('Failed to save summary:', error);
      showError('Failed to save summary.');
    }
  };

  const handleCancelEdit = () => {
    setEditingSummary(null);
    setSummaryText('');
  };

  const handleDeleteVideo = (videoId: string, videoTitle: string) => {
    setDeleteItem({ type: 'video', id: videoId, name: videoTitle });
    setShowDeleteConfirm(true);
  };

  const handleDeleteMaterial = (materialId: string, materialTitle: string) => {
    setDeleteItem({ type: 'material', id: materialId, name: materialTitle });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem || !courseId) return;

    try {
      if (deleteItem.type === 'video') {
        await instructorAPI.deleteVideo(courseId as string, deleteItem.id);
        // If the deleted video was active, clear it
        if (activeVideo?.id === deleteItem.id) {
          setActiveVideo(null);
          setVideoError(null);
        }
        showSuccess('Video deleted successfully!');
      } else {
        await instructorAPI.deleteMaterial(courseId as string, deleteItem.id);
        showSuccess('Material deleted successfully!');
      }
      // Refresh course details after deletion
      await fetchCourseDetails();
    } catch (error: any) {
      console.error(`Failed to delete ${deleteItem.type}:`, error);
      showError(error.response?.data?.error || `Failed to delete ${deleteItem.type}`);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteItem(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteItem(null);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['instructor']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={['instructor']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
            <p className="text-gray-600">The course you're looking for doesn't exist or you don't have access.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['instructor']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="px-4 sm:px-0 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                {/* Course Thumbnail */}
                <div className="flex-shrink-0">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full lg:w-80 h-56 object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-full lg:w-80 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Course Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                      <p className="text-gray-600 text-lg leading-relaxed mb-4">{course.description}</p>
                    </div>
                    {/* Status Badge */}
                    <div className="flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                        course.isPublished
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">{course.enrollmentCount || 0}</div>
                      <div className="text-sm text-gray-600">Students</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">{course.videos?.length || 0}</div>
                      <div className="text-sm text-gray-600">Videos</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">{course.materials?.length || 0}</div>
                      <div className="text-sm text-gray-600">Materials</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                      <div className="text-2xl font-bold text-gray-900">${course.price}</div>
                      <div className="text-sm text-gray-600">Price</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => router.push('/instructor')}
                    className="flex items-center text-black hover:underline transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Course Manager
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && deleteItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50"
                onClick={cancelDelete}
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
                    Are you sure you want to delete this {deleteItem.type} <strong>"{deleteItem.name}"</strong>? This action cannot be undone.
                  </p>
                  <div className="flex space-x-3 justify-end">
                    <button
                      onClick={cancelDelete}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {/* Main Content (Video Player & Summary) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeVideo ? activeVideo.title : 'Select a video to preview'}
                  </h2>
                </div>
                <div className="p-4">
                  {activeVideo ? (
                    <div className="space-y-4">
                      <VideoPlayer videoId={activeVideo.id} />

                      {/* Video Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 border-t pt-4">
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`font-semibold ${
                            activeVideo.status === 'completed' ? 'text-green-600' :
                            activeVideo.status === 'processing' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {activeVideo.status.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">File Size:</span>{' '}
                          {(activeVideo.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </div>
                        <div>
                          <span className="font-medium">Processing:</span>{' '}
                          {activeVideo.processingTime ? `${activeVideo.processingTime.toFixed(2)}s` : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Uploaded:</span>{' '}
                          {new Date(activeVideo.uploadDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🎬</div>
                      <p>Select a video from the list to start previewing</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Summary Section */}
              {activeVideo && activeVideo.status === 'completed' && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">AI Summary & Transcript</h3>
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Summary</h4>
                    {editingSummary === activeVideo.id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <textarea
                          value={summaryText}
                          onChange={(e) => setSummaryText(e.target.value)}
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Edit the AI summary..."
                        />
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleSaveSummary(activeVideo.id)}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-md"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap flex-1">
                            {activeVideo.editedSummary || activeVideo.summary || 'No summary available.'}
                          </p>
                          <button
                            onClick={() => handleEditSummary(activeVideo.id)}
                            className="ml-2 text-black hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                            title="Edit summary"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Transcript Section */}
                    {activeVideo.transcript && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                          className="flex items-center text-black hover:underline transition-colors mb-3 font-medium"
                        >
                          Full Transcript
                          {isTranscriptExpanded ? (
                            <ChevronUp className="w-4 h-4 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 ml-2" />
                          )}
                        </button>
                        <AnimatePresence>
                          {isTranscriptExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto border border-gray-200"
                            >
                              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                {activeVideo.transcript}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar (Content & Tools) */}
            <div className="space-y-6">
              {/* Videos List */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900">Course Videos</h3>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {course.videos?.map((video, index) => (
                    <div key={video.id} className="border-b border-gray-100 last:border-b-0">
                      <div
                        onClick={() => {
                          setActiveVideo(video);
                          setExpandedVideo(null);
                          setIsTranscriptExpanded(false);
                        }}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          activeVideo?.id === video.id ? 'bg-gray-100 border-l-4 border-l-black' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="shrink-0 w-6 h-6 bg-black rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {video.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVideo(video.id, video.title);
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
                                title="Delete video"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <span>{video.status}</span>
                              <span>•</span>
                              <span>{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!course.videos?.length && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No videos available yet. Upload one from the Instructor Hub.
                    </div>
                  )}
                </div>
              </div>

              {/* Materials List */}
              {course.materials && course.materials.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Course Materials</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {course.materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0"
                      >
                        <a
                          href={`http://localhost:5000/uploads/materials/${material.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center flex-1 min-w-0"
                        >
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {material.title}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {material.fileType || 'Unknown'} • {(material.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </a>
                        <button
                          onClick={() => handleDeleteMaterial(material.id, material.title)}
                          className="ml-2 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100 shrink-0"
                          title="Delete material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Component */}
              {currentUser && (
                <Chat courseId={courseId as string} currentUser={currentUser} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}