import { supabase } from '../lib/supabase.js';

export class ChatbotMessage {
  static async create(messageData) {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .insert([{
        user_id: messageData.userId,
        message: messageData.message,
        is_ai: messageData.isAi || false
      }])
      .select(`
        *,
        user:users(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUser(userId, limit = 50) {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select(`
        *,
        user:users(id, name, email, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async findByUserAfter(userId, afterTimestamp) {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select(`
        *,
        user:users(id, name, email, avatar_url)
      `)
      .eq('user_id', userId)
      .gt('created_at', afterTimestamp)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async countByUser(userId) {
    const { count, error } = await supabase
      .from('chatbot_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count;
  }
}
