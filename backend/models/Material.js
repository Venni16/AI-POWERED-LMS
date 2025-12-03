import { supabase } from '../lib/supabase.js';

export class Material {
  static async create(materialData) {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        title: materialData.title,
        filename: materialData.filename,
        original_name: materialData.originalName,
        file_size: materialData.fileSize,
        file_type: materialData.fileType,
        course_id: materialData.courseId,
        storage_path: materialData.storagePath,
        status: materialData.status || 'uploaded',
        transcript: materialData.transcript || null,
        summary: materialData.summary || null,
        edited_summary: materialData.editedSummary || null,
        processing_time: materialData.processingTime || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByCourse(courseId) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async getPublicUrl(storagePath) {
    const { data } = supabase.storage
      .from('course-content')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  static async updateStatus(id, status, aiData = {}) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        status: status,
        transcript: aiData.transcript || null,
        summary: aiData.summary || null,
        processing_time: aiData.processing_time || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSummary(id, summary) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        edited_summary: summary,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateStoragePath(id, storagePath) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        storage_path: storagePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}