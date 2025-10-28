'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../../components/common/ProtectedRoute';
import VideoPlayer from '../../../../../components/common/VideoPlayer';
import Chat from '../../../../../components/common/Chat';
import { instructorAPI, videoAPI } from '../../../../../lib/api';
import { Course, Video, User } from '../../../../../types';

export default function InstructorCourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingSummary, setEditingSummary] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>('');

  useEffect(() => {
    if (courseId && typeof courseId === 'string') {
      fetchCourseDetails();
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [courseId]);

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

  const fetchCourseDetails = async () => {
    try {
      const response = await instructorAPI.getCourseDetails(courseId as string);
      setCourse(response.data.course);
      if (response.data.course.videos?.length > 0) {
        setActiveVideo(response.data.course.videos[0]);
      }
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      if (error.response?.status === 400) {
        console.error('Bad request - invalid course ID or ownership');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoExpansion = (videoId: string) => {
    setExpandedVideo(expandedVideo === videoId ? null : videoId);
  };

  const fetchVideoUrl = async (videoId: string) => {
    try {
      // Get public URL directly
      const response = await fetch(`http://localhost:5000/api/video/${videoId}/public-url`);
      const data = await response.json();
      if (data.success) {
        setVideoUrl(data.url);
        return data.url;
      }
    } catch (error) {
      console.error('Failed to fetch video URL:', error);
    }
    return null;
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>, video: Video) => {
    const videoElement = e.target as HTMLVideoElement;
    const error = videoElement.error;
    console.error('Video loading error:', error || 'Unknown error');
    setVideoError(`Failed to load video: ${video.title}`);

    // Try alternative sources
    const sources = [
      `http://localhost:5000/api/video/${video.id}/stream`,
      `http://localhost:5000/uploads/videos/${video.filename}`,
      courseId ? `http://localhost:5000/api/courses/${courseId as string}/videos/${video.id}/file` : null
    ].filter(Boolean);

    let currentSourceIndex = sources.findIndex(src => src === videoElement.src);
    let nextSourceIndex = (currentSourceIndex + 1) % sources.length;

    if (nextSourceIndex > 0 && sources[nextSourceIndex]) {
      console.log(`Trying alternative video source: ${sources[nextSourceIndex]}`);
      videoElement.src = sources[nextSourceIndex];
    }
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
    } catch (error) {
      console.error('Failed to save summary:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingSummary(null);
    setSummaryText('');
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await instructorAPI.deleteVideo(courseId as string, videoId);
      // Refresh course details after deletion
      await fetchCourseDetails();
      // If the deleted video was active, clear it
      if (activeVideo?.id === videoId) {
        setActiveVideo(null);
        setVideoError(null);
        setVideoUrl(null);
      }
      alert('Video deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      alert(error.response?.data?.error || 'Failed to delete video');
    }
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
          <div className="text-center">
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
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col lg:flex-row lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                {/* Course Thumbnail */}
                <div className="flex-shrink-0">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full lg:w-80 h-56 object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-full lg:w-80 h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
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
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        course.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{course.enrollmentCount || 0}</div>
                      <div className="text-sm text-gray-600">Students</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{course.videos?.length || 0}</div>
                      <div className="text-sm text-gray-600">Videos</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">{course.materials?.length || 0}</div>
                      <div className="text-sm text-gray-600">Materials</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">${course.price}</div>
                      <div className="text-sm text-gray-600">Price</div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Instructor: {course.instructor.name}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Category: {course.category}
                    </span>
                    <button
                      onClick={() => router.push('/instructor')}
                      className="flex items-center text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Courses
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {activeVideo ? activeVideo.title : 'Select a video to start learning'}
                  </h2>
                </div>
                <div className="p-4">
                  {activeVideo ? (
                    <div className="space-y-4">
                      {/* Video Player with Error Handling */}
                      <div className="bg-black rounded-lg overflow-hidden">
                        {videoError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                              <div className="text-red-600 text-lg mr-2">❌</div>
                              <div>
                                <p className="text-red-800 font-medium">Video Error</p>
                                <p className="text-red-600 text-sm">{videoError}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <VideoPlayer videoId={activeVideo.id} />
                      </div>

                      {/* Video Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`${
                            activeVideo.status === 'completed' ? 'text-green-600' :
                            activeVideo.status === 'processing' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {activeVideo.status}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">File Size:</span>{' '}
                          {(activeVideo.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </div>
                        <div>
                          <span className="font-medium">Processing:</span>{' '}
                          {activeVideo.processingTime?.toFixed(2)}s
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
                      <p>Select a video from the list to start watching</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Summary Section */}
              {activeVideo && activeVideo.status === 'completed' && (
                <div className="bg-white rounded-lg shadow mt-6">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">AI Summary</h3>
                  </div>
                  <div className="p-4">
                    {editingSummary === activeVideo.id ? (
                      <div className="space-y-4">
                        <textarea
                          value={summaryText}
                          onChange={(e) => setSummaryText(e.target.value)}
                          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Edit the AI summary..."
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveSummary(activeVideo.id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap flex-1">
                            {activeVideo.editedSummary || activeVideo.summary}
                          </p>
                          <button
                            onClick={() => handleEditSummary(activeVideo.id)}
                            className="ml-2 text-blue-600 hover:text-blue-500 transition-colors"
                            title="Edit summary"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Transcript Section */}
                    {activeVideo.transcript && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3">Full Transcript</h4>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                          <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                            {activeVideo.transcript}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Course Content Sidebar */}
            <div className="space-y-6">
              {/* Videos List */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Course Videos</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {course.videos?.map((video, index) => (
                    <div key={video.id} className="border-b border-gray-200 last:border-b-0">
                      <div
                        onClick={() => {
                          setActiveVideo(video);
                          setExpandedVideo(null);
                          setVideoError(null);
                          setVideoUrl(null); // Reset video URL when switching videos
                        }}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                          activeVideo?.id === video.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
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
                                  handleDeleteVideo(video.id);
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                title="Delete video"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
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

                      {/* Expandable Summary Preview */}
                      {video.status === 'completed' && (
                        <div className="px-4 pb-4 ml-11">
                          <button
                            onClick={() => toggleVideoExpansion(video.id)}
                            className="text-sm text-blue-600 hover:text-blue-500 flex items-center"
                          >
                            {expandedVideo === video.id ? 'Hide' : 'Show'} AI Summary
                            <span className={`ml-1 transform transition-transform ${
                              expandedVideo === video.id ? 'rotate-180' : ''
                            }`}>
                              ▼
                            </span>
                          </button>

                          {expandedVideo === video.id && (
                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                              {video.editedSummary || video.summary}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {!course.videos?.length && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No videos available yet
                    </div>
                  )}
                </div>
              </div>

              {/* Materials List */}
              {course.materials && course.materials.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {course.materials.map((material) => (
                      <a
                        key={material.id}
                        href={`http://localhost:5000/uploads/materials/${material.filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors last:border-b-0"
                      >
                        <div className="shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                          {(material.fileType && material.fileType.toLowerCase().includes('pdf')) ? '📄' : '📝'}
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
