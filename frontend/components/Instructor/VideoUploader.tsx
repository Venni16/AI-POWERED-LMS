'use client';

import { useState, useEffect } from 'react';
import { instructorAPI } from '../../lib/api';
import { Course } from '../../types';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '../../lib/useToast';

export default function VideoUploader() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    video: null as File | null
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses);
      if (response.data.courses.length > 0 && !selectedCourse) {
        setSelectedCourse(response.data.courses[0].id);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      showError('Failed to load courses.');
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
      
      showSuccess('Video uploaded successfully! It will be processed automatically.');
      setFormData({ title: '', video: null });
      setUploadProgress(100);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl border border-gray-200">
      <div className="px-6 py-5 sm:p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Upload Video Content</h3>

        <form onSubmit={handleUpload} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow"
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
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
              placeholder="Enter video title..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-black transition-colors">
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
                <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium mb-1">
                  {formData.video ? formData.video.name : 'Click or drag file here to upload'}
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
                Upload Progress: {Math.round(uploadProgress)}%
              </label>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-black h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                {uploadProgress < 100 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Uploading and preparing for AI processing...
                  </>
                ) : (
                  'Upload complete. AI processing started.'
                )}
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            type="submit"
            disabled={!formData.video || !selectedCourse || uploading}
            className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>

        {/* Processing Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">AI Processing Information</h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
            <li>Videos are automatically transcribed using OpenAI Whisper.</li>
            <li>AI generates summaries using Facebook BART model.</li>
            <li>Processing time depends on video length.</li>
            <li>You can edit the generated summaries later in the course details page.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}