import axios from 'axios';
import fs from 'fs/promises';
import { FileUpload } from './fileUpload.js';

export class MaterialProcessor {
  static async processMaterialInBackground(materialId, materialPath, fileType) {
    try {
      console.log(`Processing material ${materialId} with AI...`);

      // Read the material file
      const fileBuffer = await fs.readFile(materialPath);
      const fileName = `material_${materialId}${this.getFileExtension(fileType)}`;

      // Create a file object for upload
      const file = {
        buffer: fileBuffer,
        originalname: fileName,
        mimetype: fileType,
        size: fileBuffer.length
      };

      // Get material to get courseId
      const { Material } = await import('../models/Material.js');
      const material = await Material.findById(materialId);
      if (!material) {
        throw new Error('Material not found');
      }

      // Upload to Supabase
      console.log('Uploading material to Supabase...');
      console.log('File object:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer
      });

      const uploadResult = await FileUpload.uploadMaterial(file, material.course_id, material.title);

      console.log('Upload result:', uploadResult);

      // Update material with Supabase storage path
      await Material.updateStoragePath(materialId, uploadResult.storagePath);

      console.log(`Material uploaded to Supabase: ${uploadResult.storagePath}`);

      const materialSummarizerUrl = process.env.MATERIAL_SUMMARIZER_URL || 'http://localhost:7861';

      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: this.getMimeType(fileType) });
      formData.append('file', blob, fileName);

      console.log(`Sending material to AI service: ${materialSummarizerUrl}`);

      const response = await axios.post(`${materialSummarizerUrl}/summarize-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
      });

      if (response.data.success) {
        // Update material with AI results
        await Material.updateStatus(materialId, 'completed', {
          transcript: response.data.summary, // Using summary as transcript for materials
          summary: response.data.summary,
          processing_time: response.data.processing_time
        });

        console.log(`Material ${materialId} processed successfully`);
      } else {
        throw new Error('AI service returned error: ' + JSON.stringify(response.data));
      }

      // Clean up uploaded file
      await fs.unlink(materialPath);

    } catch (error) {
      console.error(`Error processing material ${materialId}:`, error);

      // Update material status to error
      const { Material } = await import('../models/Material.js');
      await Material.updateStatus(materialId, 'error');
    }
  }

  static getMimeType(fileType) {
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc': 'application/msword',
      '.txt': 'text/plain',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt': 'application/vnd.ms-powerpoint'
    };
    
    return mimeTypes[fileType] || 'application/octet-stream';
  }

  static getFileExtension(fileType) {
    const extensions = {
      'application/pdf': '.pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/msword': '.doc',
      'text/plain': '.txt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'application/vnd.ms-powerpoint': '.ppt'
    };
    
    return extensions[fileType] || '.bin';
  }
}