import { supabase } from '../lib/supabase.js';

export class Video {
  static async create(videoData) {
    const { data, error } = await supabase
      .from('videos')
      .insert([{
        title: videoData.title,
        filename: videoData.filename,
        original_name: videoData.originalName,
        file_size: videoData.fileSize,
        file_type: videoData.fileType,
        duration: videoData.duration,
        transcript: videoData.transcript,
        summary: videoData.summary,
        edited_summary: videoData.editedSummary,
        processing_time: videoData.processingTime,
        status: videoData.status,
        course_id: videoData.courseId,
        storage_path: videoData.storagePath
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByCourse(courseId) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async updateStatus(id, status, results = {}) {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (results.transcript) updates.transcript = results.transcript;
    if (results.summary) {
      updates.summary = results.summary;
      updates.edited_summary = results.summary;
    }
    if (results.processingTime) updates.processing_time = results.processingTime;

    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSummary(id, summary) {
    const { data, error } = await supabase
      .from('videos')
      .update({
        edited_summary: summary
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}