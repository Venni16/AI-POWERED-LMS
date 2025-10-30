'use client';

import { useState, useEffect } from 'react';
import { instructorAPI } from '../../lib/api';
import { Course } from '../../types';

export default function McqManager() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [mcqs, setMcqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    option5: '',
    correctOption: 1
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchMcqs();
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await instructorAPI.getCourses();
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchMcqs = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    try {
      const response = await instructorAPI.getMcqs(selectedCourse);
      setMcqs(response.data.mcqs);
    } catch (error) {
      console.error('Error fetching MCQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMcq = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      alert('Please select a course first');
      return;
    }

    try {
      await instructorAPI.createMcq(selectedCourse, formData);
      setShowCreateForm(false);
      setFormData({
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        option5: '',
        correctOption: 1
      });
      fetchMcqs();
      alert('MCQ created successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create MCQ');
    }
  };

  const handleDeleteMcq = async (mcqId: string) => {
    if (!confirm('Are you sure you want to delete this MCQ?')) {
      return;
    }

    try {
      await instructorAPI.deleteMcq(selectedCourse, mcqId);
      fetchMcqs();
      alert('MCQ deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete MCQ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Course</h3>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a course...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {selectedCourse && (
        <>
          {/* Create MCQ Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New MCQ</h3>
              <form onSubmit={handleCreateMcq} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Question *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.question}
                    onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the question"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num}>
                      <label className="block text-sm font-medium text-gray-700">
                        Option {num} {num === formData.correctOption ? '(Correct)' : ''} *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData[`option${num}` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`option${num}`]: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Enter option ${num}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Correct Option *</label>
                  <select
                    value={formData.correctOption}
                    onChange={(e) => setFormData(prev => ({ ...prev, correctOption: parseInt(e.target.value) }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>
                        Option {num}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Create MCQ
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

          {/* MCQs List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">MCQs for Selected Course</h3>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Create MCQ
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto"></div>
                </div>
              ) : mcqs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-6xl mb-4">❓</div>
                  <p>No MCQs created yet for this course.</p>
                  <p className="text-sm">Create your first MCQ to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mcqs.map((mcq, index) => (
                    <div key={mcq.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {index + 1}. {mcq.question}
                        </h4>
                        <button
                          onClick={() => handleDeleteMcq(mcq.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete MCQ"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((optionNum) => {
                          const optionKey = `option${optionNum}` as keyof typeof mcq;
                          const optionText = mcq[optionKey];
                          const isCorrect = optionNum === mcq.correct_option;

                          return (
                            <div
                              key={optionNum}
                              className={`p-3 rounded-md border ${
                                isCorrect
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(64 + optionNum)}.
                              </span>{' '}
                              {optionText}
                              {isCorrect && (
                                <span className="ml-2 text-green-600 font-medium">(Correct Answer)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
