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
        storage_path: materialData.storagePath
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
}