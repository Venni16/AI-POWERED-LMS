import { supabase } from '../lib/supabase.js';

export class Enrollment {
  static async create(enrollmentData) {
    const { data, error } = await supabase
      .from('enrollments')
      .insert([{
        student_id: enrollmentData.studentId,
        course_id: enrollmentData.courseId
      }])
      .select(`
        *,
        student:users(id, name, email, avatar_url),
        course:courses(id, title, instructor_id)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByStudentAndCourse(studentId, courseId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByStudent(studentId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(
          id,
          title,
          description,
          category,
          price,
          thumbnail_url,
          is_published,
          enrollment_count,
          instructor:users(id, name, email, avatar_url, specialization)
        )
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findByCourse(courseId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        student:users(id, name, email, avatar_url)
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getEnrollmentCount(courseId) {
    const { count, error } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (error) throw error;
    return count;
  }

  static async delete(studentId, courseId) {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) throw error;
    return true;
  }
}