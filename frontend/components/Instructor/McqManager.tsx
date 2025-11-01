'use client';

import { useState, useEffect } from 'react';
import { instructorAPI } from '../../lib/api';
import { Course } from '../../types';
import { Plus, Trash2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../lib/useToast';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mcqToDelete, setMcqToDelete] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchMcqs();
    } else {
      setMcqs([]);
    }
  }, [selectedCourse]);

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

  const fetchMcqs = async () => {
    if (!selectedCourse) return;

    setLoading(true);
    try {
      const response = await instructorAPI.getMcqs(selectedCourse);
      setMcqs(response.data.mcqs);
    } catch (error) {
      console.error('Error fetching MCQs:', error);
      showError('Failed to load MCQs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMcq = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourse) {
      showError('Please select a course first');
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
      showSuccess('MCQ created successfully!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to create MCQ');
    }
  };

  const handleDeleteMcq = (mcqId: string) => {
    setMcqToDelete(mcqId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMcq = async () => {
    if (!mcqToDelete || !selectedCourse) return;

    try {
      await instructorAPI.deleteMcq(selectedCourse, mcqToDelete);
      fetchMcqs();
      showSuccess('MCQ deleted successfully!');
    } catch (error: any) {
      showError(error.response?.data?.error || 'Failed to delete MCQ');
    } finally {
      setShowDeleteConfirm(false);
      setMcqToDelete(null);
    }
  };

  const cancelDeleteMcq = () => {
    setShowDeleteConfirm(false);
    setMcqToDelete(null);
  };

  const currentCourse = courses.find(c => c.id === selectedCourse);

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
            onClick={cancelDeleteMcq}
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
                Are you sure you want to delete this MCQ? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={cancelDeleteMcq}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteMcq}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Selection */}
      <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quiz Management</h3>
        <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
          <label className="block text-sm font-medium text-gray-700 shrink-0">Select Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="block w-full md:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow"
          >
            <option value="">Choose a course...</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {currentCourse && (
            <p className="text-sm text-gray-600 mt-2 md:mt-0">
              {mcqs.length} MCQs currently available for this course.
            </p>
          )}
        </div>
      </div>

      {selectedCourse && (
        <>
          {/* Create MCQ Form */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New MCQ</h3>
                <form onSubmit={handleCreateMcq} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                    <textarea
                      required
                      rows={3}
                      value={formData.question}
                      onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                      placeholder="Enter the question"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Option {num}
                        </label>
                        <input
                          type="text"
                          required
                          value={formData[`option${num}` as keyof typeof formData] as string}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`option${num}`]: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black transition-shadow"
                          placeholder={`Enter option ${num}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Option *</label>
                    <select
                      value={formData.correctOption}
                      onChange={(e) => setFormData(prev => ({ ...prev, correctOption: parseInt(e.target.value) }))}
                      className="block w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-black focus:border-black bg-white transition-shadow"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          Option {num}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
                    >
                      Create MCQ
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
          </AnimatePresence>

          {/* MCQs List */}
          <div className="bg-white shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  MCQs for: {currentCourse?.title || 'N/A'}
                </h3>
                <button
                  onClick={() => setShowCreateForm(prev => !prev)}
                  className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {showCreateForm ? 'Hide Form' : 'Create MCQ'}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="loading-spinner mx-auto"></div>
                  <p className="text-gray-600 mt-3">Loading MCQs...</p>
                </div>
              ) : mcqs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">❓</div>
                  <p className="text-xl font-medium">No MCQs created yet.</p>
                  <p className="text-sm mt-2">Use the button above to add your first question.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {mcqs.map((mcq, index) => (
                    <div key={mcq.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-medium text-gray-900 flex-1 pr-4">
                          {index + 1}. {mcq.question}
                        </h4>
                        <button
                          onClick={() => handleDeleteMcq(mcq.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-100"
                          title="Delete MCQ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((optionNum) => {
                          const optionKey = `option${optionNum}` as keyof typeof mcq;
                          const optionText = mcq[optionKey];
                          const isCorrect = optionNum === mcq.correct_option;

                          if (!optionText) return null;

                          return (
                            <div
                              key={optionNum}
                              className={`p-3 rounded-lg border flex items-center text-sm ${
                                isCorrect
                                  ? 'bg-green-50 border-green-300 text-green-800 font-medium'
                                  : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 mr-3 shrink-0" />
                              ) : (
                                <HelpCircle className="w-4 h-4 mr-3 shrink-0 text-gray-500" />
                              )}
                              <span className="font-semibold w-4 shrink-0">
                                {String.fromCharCode(64 + optionNum)}.
                              </span>{' '}
                              <span className="flex-1">{optionText}</span>
                              {isCorrect && (
                                <span className="ml-4 text-xs font-bold uppercase tracking-wider">Correct</span>
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