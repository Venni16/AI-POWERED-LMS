import { supabase } from '../lib/supabase.js';
import multer from 'multer';

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

export class FileUpload {
  static async uploadVideo(file, courseId, title) {
    console.log('Starting video upload to Supabase...');
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      hasBuffer: !!file.buffer
    });

    const fileExt = file.originalname.split('.').pop();
    const fileName = `video-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `videos/${courseId}/${fileName}`;

    console.log('Uploading to Supabase path:', filePath);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('course-content')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    console.log('Supabase upload successful:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-content')
      .getPublicUrl(filePath);

    console.log('Public URL generated:', publicUrl);

    return {
      filename: fileName,
      originalName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      storagePath: filePath,
      publicUrl: publicUrl
    };
  }

  static async uploadMaterial(file, courseId, title) {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `material-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `materials/${courseId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('course-content')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('course-content')
      .getPublicUrl(filePath);

    return {
      filename: fileName,
      originalName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      storagePath: filePath,
      publicUrl: publicUrl
    };
  }

  static async deleteFile(storagePath) {
    const { error } = await supabase.storage
      .from('course-content')
      .remove([storagePath]);

    if (error) throw error;
    return true;
  }

  static async getSignedUrl(storagePath, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from('course-content')
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }
}