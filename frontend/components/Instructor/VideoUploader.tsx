'use client';

import { useState, useEffect } from 'react';
import { instructorAPI } from '../../lib/api';
import { Course, Video } from '../../types';

export default function VideoUploader() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    video: null as File | null
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses);
      if (response.data.courses.length > 0) {
        setSelectedCourse(response.data.courses[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        video: file,
        title: file.name.replace(/\.[^/.]+$/, "") // Remove extension for default title
      }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.video || !selectedCourse) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('video', formData.video);
      uploadData.append('title', formData.title);
      uploadData.append('courseId', selectedCourse);

      await instructorAPI.uploadVideo(selectedCourse, uploadData, {
        onUploadProgress: (progressEvent: any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      alert('Video uploaded successfully! It will be processed automatically.');
      setFormData({ title: '', video: null });
      setUploadProgress(100);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Upload Video Content</h3>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a course</option>
            {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Video Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter video title..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="video-upload"
                disabled={uploading}
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer block"
              >
                <div className="text-4xl mb-2">🎬</div>
                <p className="text-sm text-gray-600 mb-2">
                  {formData.video ? formData.video.name : 'Click to select video file'}
                </p>
                <p className="text-xs text-gray-500">
                  Supported formats: MP4, AVI, MOV, MKV, WMV (Max 100MB)
                </p>
              </label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Progress
              </label>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {Math.round(uploadProgress)}% - Processing video...
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            type="submit"
            disabled={!formData.video || !selectedCourse || uploading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>

        {/* Processing Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">AI Processing Information</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Videos are automatically transcribed using OpenAI Whisper</li>
            <li>• AI generates summaries using Facebook BART model</li>
            <li>• Processing time depends on video length</li>
            <li>• You can edit the generated summaries later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}