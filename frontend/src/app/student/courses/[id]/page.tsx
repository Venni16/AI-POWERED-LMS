'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../../components/common/ProtectedRoute';
import VideoPlayer from '../../../../../components/common/VideoPlayer';
import Chat from '../../../../../components/common/Chat';
import { studentAPI, videoAPI } from '../../../../../lib/api';
import { Course, Video, User } from '../../../../../types';

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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
      const response = await studentAPI.getCourseDetails(courseId as string);
      setCourse(response.data.course);
      if (response.data.course.videos?.length > 0) {
        setActiveVideo(response.data.course.videos[0]);
      }
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      if (error.response?.status === 400) {
        console.error('Bad request - invalid course ID or enrollment');
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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="loading-spinner"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!course) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
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
    <ProtectedRoute allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full md:w-64 h-48 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    <span>Instructor: {course.instructor.name}</span>
                    <span>•</span>
                    <span>Category: {course.category}</span>
                    <span>•</span>
                    <span>{course.videos?.length || 0} videos</span>
                    <span>•</span>
                    <span>{course.materials?.length || 0} materials</span>
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
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {activeVideo.editedSummary || activeVideo.summary}
                      </p>
                    </div>
                    
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
                      <button
                        onClick={() => {
                          setActiveVideo(video);
                          setExpandedVideo(null);
                          setVideoError(null);
                          setVideoUrl(null); // Reset video URL when switching videos
                        }}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          activeVideo?.id === video.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {video.title}
                            </h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <span>{video.status}</span>
                              <span>•</span>
                              <span>{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                          </div>
                        </div>
                      </button>
                      
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
                        key={material._id}
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