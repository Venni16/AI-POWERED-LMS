import { supabase } from '../lib/supabase.js';

export class Achievement {
  static async create(achievementData) {
    const { data, error } = await supabase
      .from('achievement')
      .insert([{
        student_id: achievementData.studentId,
        course_id: achievementData.courseId,
        type: achievementData.type,
        title: achievementData.title,
        description: achievementData.description
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByStudent(studentId) {
    const { data, error } = await supabase
      .from('achievement')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findByStudentAndCourse(studentId, courseId) {
    const { data, error } = await supabase
      .from('achievement')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('achievement')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async countByStudent(studentId) {
    const { count, error } = await supabase
      .from('achievement')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId);

    if (error) throw error;
    return count;
  }
}
