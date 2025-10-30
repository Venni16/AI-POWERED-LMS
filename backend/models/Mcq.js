import { supabase } from '../lib/supabase.js';

export class Mcq {
  static async create(mcqData) {
    const { data, error } = await supabase
      .from('mcq')
      .insert([{
        course_id: mcqData.courseId,
        question: mcqData.question,
        option1: mcqData.option1,
        option2: mcqData.option2,
        option3: mcqData.option3,
        option4: mcqData.option4,
        option5: mcqData.option5,
        correct_option: mcqData.correctOption
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByCourseId(courseId) {
    const { data, error } = await supabase
      .from('mcq')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('mcq')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('mcq')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('mcq')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async countByCourse(courseId) {
    const { count, error } = await supabase
      .from('mcq')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (error) throw error;
    return count;
  }
}
