export interface Mcq {
  id: string;
  course_id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  option5: string;
  correct_option: number;
  created_at: string;
}

export interface McqSubmissionResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  details: {
    mcqId: string;
    question: string;
    studentAnswer: string | null;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
}
