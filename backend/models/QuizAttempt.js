import { supabase } from '../lib/supabase.js';

export class QuizAttempt {
  static async create(attemptData) {
    const { data, error } = await supabase
      .from('quiz_attempt')
      .insert([{
        student_id: attemptData.studentId,
        course_id: attemptData.courseId,
        attempt_number: attemptData.attemptNumber,
        score: attemptData.score,
        total_questions: attemptData.totalQuestions,
        correct_answers: attemptData.correctAnswers
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByStudentAndCourse(studentId, courseId) {
    const { data, error } = await supabase
      .from('quiz_attempt')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async countAttemptsByStudentAndCourse(studentId, courseId) {
    const { count, error } = await supabase
      .from('quiz_attempt')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) throw error;
    return count;
  }

  static async getLatestAttemptByStudentAndCourse(studentId, courseId) {
    const { data, error } = await supabase
      .from('quiz_attempt')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data || null;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('quiz_attempt')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}
