'use client';

import { useState, useEffect } from 'react';
import { Mcq, McqSubmissionResult } from '../../types/mcq';
import { studentAPI } from '../../lib/api';

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
    try {
      const response = await studentAPI.getMcqs(courseId);
      setMcqs(response.data.mcqs);
    } catch (error: any) {
      setError('Failed to load quiz questions');
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
    if (Object.keys(answers).length === 0) {
      setError('Please answer at least one question');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await studentAPI.submitMcqAnswers(courseId, answers);
      setResult(response.data.results);
    } catch (error: any) {
      setError('Failed to submit answers');
      console.error('Error submitting MCQ answers:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setResult(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="loading-spinner mb-4"></div>
            <p>Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Results</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{result.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.correctAnswers}</div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{result.score}%</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {result.details.map((detail, index) => (
              <div key={detail.mcqId} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    detail.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{detail.question}</p>
                    <div className="text-sm">
                      <p className="text-gray-600">
                        Your answer: <span className={detail.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {detail.studentAnswer ? `Option ${detail.studentAnswer}` : 'Not answered'}
                        </span>
                      </p>
                      {!detail.isCorrect && (
                        <p className="text-gray-600">
                          Correct answer: <span className="text-green-600">Option {detail.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={resetQuiz}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Retake Quiz
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Course Quiz</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6 mb-6">
          {mcqs.map((mcq, index) => (
            <div key={mcq.id} className="border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {index + 1}. {mcq.question}
              </h3>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((optionNum) => {
                  const optionKey = `option${optionNum}` as keyof Mcq;
                  const optionText = mcq[optionKey] as string;

                  if (!optionText) return null;

                  return (
                    <label key={optionNum} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name={mcq.id}
                        value={optionNum.toString()}
                        checked={answers[mcq.id] === optionNum.toString()}
                        onChange={(e) => handleAnswerChange(mcq.id, e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{optionText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Answered: {Object.keys(answers).length} / {mcqs.length}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
