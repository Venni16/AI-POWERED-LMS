'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ProtectedRoute from '../../../../../components/common/ProtectedRoute';
import VideoPlayer from '../../../../../components/common/VideoPlayer';
import Chat from '../../../../../components/common/Chat';
import McqQuiz from '../../../../../components/student/McqQuiz';
import { studentAPI, instructorAPI } from '../../../../../lib/api';
import { Course, Video, User, Mcq } from '../../../../../types';
import { BookOpen, Video as VideoIcon, FileText, MessageSquare, HelpCircle, Loader2, ChevronDown, ChevronUp, CheckCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Check if courseId is a UUID or slug
  const isUUID = courseId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId) : false;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeMaterial, setActiveMaterial] = useState<any | null>(null);
  const [materialSummary, setMaterialSummary] = useState<string>('');

  // Download handler for video summary or transcript
  const downloadVideoFile = async (videoId: string, type: 'summary' | 'transcript') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/video/${videoId}/download-${type}`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = '';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) filename = match[1];
      }
      // Fallback filename if needed
      if (!filename && activeVideo) {
        const suffix = type === 'summary' ? 'Summary' : 'Transcript';
        filename = `${course?.title || ''} - ${activeVideo.title} ${suffix}.txt`;
      }
      filename = filename || 'download.txt';

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Download handler for material summary
  const downloadMaterialSummary = async (materialId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL}/material/${materialId}/download-summary`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = '';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) filename = match[1];
      }
      const material = course?.materials?.find(m => m.id === materialId);
      if (!filename && material) {
        filename = `${course?.title || ''} - ${material.title} Summary.txt`;
      }
      filename = filename || 'download.txt';

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

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
      const response = await studentAPI.getCourseDetails(courseId as string);
      const fetchedCourse = response.data.course;
      setCourse(fetchedCourse);
      
      // Set active video: prioritize the first unwatched video, otherwise the first video
      const firstUnwatched = fetchedCourse.videos?.find((v: Video) => !v.studentProgress?.completed);
      setActiveVideo(firstUnwatched || fetchedCourse.videos?.[0] || null);

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

  const handleVideoComplete = (videoId: string) => {
    // Optimistically update UI
    setCourse(prevCourse => {
      if (!prevCourse) return null;
      const updatedVideos = prevCourse.videos?.map(v => {
        if (v.id === videoId) {
          return {
            ...v,
            studentProgress: { completed: true, completedAt: new Date().toISOString() }
          };
        }
        return v;
      });
      return { ...prevCourse, videos: updatedVideos };
    });
    // Fetch full details to ensure progress is updated correctly
    fetchCourseDetails();
  };

  const handleMaterialClick = async (material: any) => {
    setActiveMaterial(material);
    if (material.status === 'completed') {
      try {
        const response = await instructorAPI.getMaterialSummary(material.id);
        if (response.data.success) {
          setMaterialSummary(response.data.material.edited_summary || response.data.material.summary || 'No summary available.');
        } else {
          setMaterialSummary('Failed to load summary.');
        }
      } catch (error) {
        console.error('Failed to fetch material summary:', error);
        setMaterialSummary('Failed to load summary.');
      }
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
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
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
        <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
          {/* Course Header */}
          <div className="px-4 sm:px-0 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <button
                onClick={() => router.push('/student?tab=my-courses')}
                className="flex items-center text-black hover:underline transition-colors mb-4 text-sm font-medium hover:cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to My Courses
              </button>
              <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="flex-shrink-0">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full md:w-64 h-40 object-cover rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-full md:w-64 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {course.category}
                    </span>
                    <span className="flex items-center">
                      <VideoIcon className="w-4 h-4 mr-1" />
                      {course.videos?.length || 0} videos
                    </span>
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {course.materials?.length || 0} materials
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 sm:px-0">
            {/* Main Content (Video Player, Material Summary & Summary) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeVideo ? activeVideo.title : 'Select a video to start learning'}
                  </h2>
                </div>
                <div className="p-4">
                  {activeVideo ? (
                    <div className="space-y-4">
                      <VideoPlayer
                        videoId={activeVideo.id}
                        courseId={courseId as string}
                        onVideoComplete={handleVideoComplete}
                      />
                      
                      {/* Video Status */}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Processing Status:</span>
                          <span className={`font-semibold ${
                            activeVideo.status === 'completed' ? 'text-green-600' :
                            activeVideo.status === 'processing' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {activeVideo.status.toUpperCase()}
                          </span>
                        </div>
                        {activeVideo.studentProgress?.completed && (
                          <div className="flex items-center text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completed
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🎬</div>
                      <p>No videos available in this course yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Material Summary Section */}
              {activeMaterial && activeMaterial.status === 'completed' && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Material AI Summary</h3>
                    <button
                      onClick={() => downloadMaterialSummary(activeMaterial.id)}
                      title="Download material summary"
                      className="flex items-center border p-2 rounded-2xl font-medium hover:bg-gray-800 bg-black text-sm text-white hover:cursor-pointer shadow-md hover:shadow-lg transition-colors"
                    >
                      <Download className="w-3 h-3 mr-1 font-medium" /> Download Summary
                    </button>
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Summary</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {materialSummary || 'No summary available.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Summary Section */}
              {activeVideo && activeVideo.status === 'completed' && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Video AI Summary & Transcript</h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => downloadVideoFile(activeVideo.id, 'summary')}
                        title="Download video summary"
                        className="flex items-center border p-2 rounded-2xl font-medium bg-black text-sm text-white hover:cursor-pointer shadow-md hover:shadow-lg transition-colors"
                      >
                        <Download className="w-3 h-3 mr-1" /> Download Summary
                      </button>
                      {activeVideo.transcript && (
                        <button
                          onClick={() => downloadVideoFile(activeVideo.id, 'transcript')}
                          title="Download video transcript"
                          className="flex items-center border p-2 rounded-2xl font-medium bg-black text-sm text-white hover:cursor-pointer shadow-md hover:shadow-lg transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" /> Download Transcript
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-medium text-gray-800 mb-3">Summary</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {activeVideo.editedSummary || activeVideo.summary || 'No summary available.'}
                    </p>
                  </div>

                    {/* Transcript Section */}
                    {activeVideo.transcript && (
                      <div className="mt-6">
                        <button
                          onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                          className="flex items-center text-black hover:underline transition-colors mb-3 font-medium hover:cursor-pointer"
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
                  <h3 className="text-xl font-semibold text-gray-900">Course Content</h3>
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  {course.videos?.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => {
                        setActiveVideo(video);
                        setExpandedVideo(null);
                        setIsTranscriptExpanded(false);
                      }}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 hover:cursor-pointer transition-colors last:border-b-0 ${
                        activeVideo?.id === video.id ? 'bg-gray-100 border-l-4 border-l-black' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="shrink-0 w-6 h-6 bg-black rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {video.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                            {video.studentProgress?.completed && (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            )}
                            <span>{video.status}</span>
                            <span>•</span>
                            <span>{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
                        </div>
                      </div>
                    </button>
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
                <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900">Materials</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {course.materials.map((material) => (
                      <div
                        key={material.id}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <div
                          onClick={() => handleMaterialClick(material)}
                          className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            activeMaterial?.id === material.id ? 'bg-gray-100 border-l-4 border-l-black' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {material.title}
                                </h4>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                  <span>{material.status}</span>
                                  <span>•</span>
                                  <span>{material.fileType || 'Unknown'} • {(material.fileSize / 1024).toFixed(1)} KB</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const token = localStorage.getItem('token');
                                  if (!token) {
                                    console.error('No authentication token found');
                                    return;
                                  }

                                  // Fetch the file as a blob with authentication
                                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/material/${material.id}/download`, {
                                    method: 'GET',
                                    headers: {
                                      'Authorization': `Bearer ${token}`
                                    }
                                  });

                                  if (!response.ok) {
                                    throw new Error(`Download failed: ${response.status}`);
                                  }

                                  // Create blob and download link
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = material.title || 'download';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error) {
                                  console.error('Download error:', error);
                                }
                              }}
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-100"
                              title="Download material"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MCQs Section */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">Course Quiz</h3>
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-1 shadow-md hover:shadow-lg hover:cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Take Quiz</span>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm">
                    Test your knowledge with multiple-choice questions covering the course content.
                  </p>
                </div>
              </div>

              {/* Chat Component */}
              {currentUser && course && (
                <Chat courseId={course.id} currentUser={currentUser} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <McqQuiz courseId={courseId as string} onClose={() => setShowQuiz(false)} />
        )}
      </AnimatePresence>
    </ProtectedRoute>
  );
}