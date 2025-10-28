import { supabase } from '../lib/supabase.js';

export class ChatMessage {
  static async create(messageData) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        course_id: messageData.courseId,
        sender_id: messageData.senderId,
        message: messageData.message
      }])
      .select(`
        *,
        sender:users(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByCourse(courseId, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(id, name, email, avatar_url)
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async findByCourseAfter(courseId, afterTimestamp) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users(id, name, email, avatar_url)
      `)
      .eq('course_id', courseId)
      .gt('created_at', afterTimestamp)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async countByCourse(courseId) {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (error) throw error;
    return count;
  }
}
