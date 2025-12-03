import { supabase } from '../lib/supabase.js';

export class Payment {
  static async create(paymentData) {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        user_id: paymentData.userId,
        course_id: paymentData.courseId, // Corrected: Use courseId instead of amount
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        status: paymentData.status || 'pending',
        stripe_session_id: paymentData.stripeSessionId,
        enrollment_id: paymentData.enrollmentId || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findBySessionId(sessionId) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateStatus(sessionId, status, enrollmentId = null) {
    const updates = { status };
    if (enrollmentId) {
      updates.enrollment_id = enrollmentId;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('stripe_session_id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}