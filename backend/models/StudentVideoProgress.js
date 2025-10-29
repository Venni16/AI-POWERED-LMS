import { supabase } from '../lib/supabase.js';

export class StudentVideoProgress {
  static async create(progressData) {
    const { data, error } = await supabase
      .from('student_video_progress')
      .insert([{
        student_id: progressData.studentId,
        video_id: progressData.videoId,
        course_id: progressData.courseId,
        completed: progressData.completed || false,
        completed_at: progressData.completed ? new Date().toISOString() : null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findByStudentAndVideo(studentId, videoId) {
    const { data, error } = await supabase
      .from('student_video_progress')
      .select('*')
      .eq('student_id', studentId)
      .eq('video_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  static async findByStudentAndCourse(studentId, courseId) {
    const { data, error } = await supabase
      .from('student_video_progress')
      .select(`
        *,
        video:video_id(id, title)
      `)
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) throw error;
    return data;
  }

  static async update(studentId, videoId, updates) {
    const updateData = { ...updates };
    if (updates.completed) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('student_video_progress')
      .update(updateData)
      .eq('student_id', studentId)
      .eq('video_id', videoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async upsert(studentId, videoId, courseId, completed) {
    const { data, error } = await supabase
      .from('student_video_progress')
      .upsert({
        student_id: studentId,
        video_id: videoId,
        course_id: courseId,
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      }, {
        onConflict: 'student_id,video_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(studentId, videoId) {
    const { error } = await supabase
      .from('student_video_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('video_id', videoId);

    if (error) throw error;
    return true;
  }
}
