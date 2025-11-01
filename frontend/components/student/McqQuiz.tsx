'use client';

import { useState, useEffect } from 'react';
import { Mcq, McqSubmissionResult } from '../../types/mcq';
import { studentAPI } from '../../lib/api';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface McqQuizProps {
  courseId: string;
  onClose: () => void;
}

export default function McqQuiz({ courseId, onClose }: McqQuizProps) {
  const [mcqs, setMcqs] = useState<Mcq[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<McqSubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMcqs();
  }, [courseId]);

  const fetchMcqs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentAPI.getMcqs(courseId);
      setMcqs(response.data.mcqs);
      if (response.data.mcqs.length === 0) {
        setError('No quiz questions available for this course.');
      }
    } catch (error: any) {
      setError('Failed to load quiz questions.');
      console.error('Error fetching MCQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (mcqId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [mcqId]: option
    }));
  };

  const handleSubmit = async () => {
    if (mcqs.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await studentAPI.submitMcqAnswers(courseId, answers);
      setResult(response.data.results);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit answers');
      console.error('Error submitting MCQ answers:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setError(null);
    fetchMcqs(); // Reload questions in case they changed
  };

  const QuizContent = () => {
    if (loading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Close
          </button>
        </div>
      );
    }

    if (result) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-black">{result.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${result.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.score}%
                </div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6 max-h-80 overflow-y-auto custom-scrollbar">
            {result.details.map((detail, index) => (
              <div key={detail.mcqId} className={`border rounded-xl p-4 ${detail.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    detail.isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{detail.question}</p>
                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        Your answer: <span className={`font-semibold ${detail.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                          {detail.studentAnswer ? `Option ${detail.studentAnswer}` : 'Not answered'}
                        </span>
                      </p>
                      {!detail.isCorrect && (
                        <p className="text-gray-700">
                          Correct answer: <span className="font-semibold text-black">Option {detail.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              onClick={resetQuiz}
              className="px-6 py-2 text-black border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              Retake Quiz
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">Course Quiz</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 mb-6 max-h-96 overflow-y-auto custom-scrollbar">
          {mcqs.map((mcq, index) => (
            <div key={mcq.id} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <span className="font-bold mr-2">{index + 1}.</span> {mcq.question}
              </h3>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((optionNum) => {
                  const optionKey = `option${optionNum}` as keyof Mcq;
                  const optionText = mcq[optionKey] as string;

                  if (!optionText) return null;

                  const isSelected = answers[mcq.id] === optionNum.toString();

                  return (
                    <label
                      key={optionNum}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'bg-black text-white border-black shadow-md' : 'bg-white border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={mcq.id}
                        value={optionNum.toString()}
                        checked={isSelected}
                        onChange={(e) => handleAnswerChange(mcq.id, e.target.value)}
                        className={`w-4 h-4 ${isSelected ? 'text-white bg-white border-white' : 'text-black border-gray-300 focus:ring-black'}`}
                        style={{
                          appearance: 'none',
                          borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'white' : '#d1d5db'}`,
                          width: '16px',
                          height: '16px',
                          position: 'relative',
                          flexShrink: 0,
                        }}
                      />
                      <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-700'}`}>{optionText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600 font-medium">
            Answered: <span className="font-bold text-black">{Object.keys(answers).length}</span> / {mcqs.length}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || mcqs.length === 0}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md flex items-center space-x-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Submitting...' : 'Submit Quiz'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <QuizContent />
        </div>
      </div>
    </div>
  );
}