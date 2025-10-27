import { supabase } from '../lib/supabase.js';

export class AuditLog {
  static async create(logData) {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: logData.userId,
        action: logData.action,
        resource: logData.resource,
        details: logData.details,
        ip_address: logData.ipAddress,
        user_agent: logData.userAgent
      }])
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findAll(filters = {}) {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  static async getPaginated(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, email, role)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  static async findByUser(userId, limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  static async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(id, name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}