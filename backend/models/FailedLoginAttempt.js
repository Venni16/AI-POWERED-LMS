import { supabase } from '../lib/supabase.js';

export class FailedLoginAttempt {
  static async create(attemptData) {
    const { data, error } = await supabase
      .from('failed_login_attempts')
      .insert([{
        email: attemptData.email,
        ip_address: attemptData.ipAddress,
        user_agent: attemptData.userAgent
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async countRecentAttempts(email, minutes = 15) {
    const { count, error } = await supabase
      .from('failed_login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .gte('attempted_at', new Date(Date.now() - minutes * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  }

  static async cleanupOldAttempts() {
    const { error } = await supabase
      .from('failed_login_attempts')
      .delete()
      .lt('attempted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
  }
}
