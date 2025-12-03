import express from 'express';
import axios from 'axios';
import { FileUpload, upload } from '../utils/fileUpload.js';
import { Material } from '../models/Material.js';
import { Course } from '../models/Course.js';
import { authenticate } from '../middleware/auth.js';
import { MaterialProcessor } from '../utils/materialProcessor.js';

const router = express.Router();

// Upload and process material
const uploadFields = upload.fields([{ name: 'material', maxCount: 1 }, { name: 'title' }, { name: 'courseId' }]);
router.post('/process', authenticate, uploadFields, async (req, res) => {
  try {
    console.log('Material upload route called');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    if (!req.files?.material) {
      return res.status(400).json({ error: 'No material file uploaded' });
    }

    const { courseId, title } = req.body;

    // Check if user is instructor of the course
    const course = await Course.findById(courseId);
    if (!course || course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Starting material processing...');

    // Create material record
    const material = await Material.create({
      title: title || req.files.material[0].originalname,
      filename: req.files.material[0].originalname,
      originalName: req.files.material[0].originalname,
      fileSize: req.files.material[0].size,
      fileType: req.files.material[0].mimetype,
      courseId: courseId,
      storagePath: null, // Will be set during processing
      status: 'processing'
    });

    // Process with AI in background
    MaterialProcessor.processMaterialInBackground(material.id, req.files.material[0].path, req.files.material[0].mimetype);

    res.json({
      success: true,
      materialId: material.id,
      message: 'Material uploaded and processing started'
    });

  } catch (error) {
    console.error('Material upload error:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

// Download material file
router.get('/:materialId/download', authenticate, async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if user has access to the course
    const course = await Course.findById(material.course_id);
    const hasAccess = await checkCourseAccess(course, req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if material has been processed and has a storage path
    if (!material.storage_path) {
      return res.status(400).json({ error: 'Material is still processing or not available for download' });
    }

    // Get signed URL for secure access
    const signedUrl = await FileUpload.getSignedUrl(material.storage_path, 3600); // 1 hour expiry

    // Fetch the file from Supabase using the signed URL
    const response = await axios.get(signedUrl, {
      responseType: 'stream',
      timeout: 30000 // 30 seconds timeout
    });

    // Set appropriate headers for download
    const fileName = material.original_name || material.title || 'download';
    res.setHeader('Content-Type', material.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', response.headers['content-length']);

    // Pipe the file stream to the response
    response.data.pipe(res);

    // Handle errors during streaming
    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });

  } catch (error) {
    console.error('Material download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download material' });
    }
  }
});

// Get material status and summary
router.get('/:materialId/summary', authenticate, async (req, res) => {
  try {
    const material = await Material.findById(req.params.materialId);
    
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if user has access to the course
    const course = await Course.findById(material.course_id);
    const hasAccess = await checkCourseAccess(course, req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      material: {
        id: material.id,
        title: material.title,
        status: material.status,
        summary: material.edited_summary || material.summary,
        transcript: material.transcript,
        processingTime: material.processing_time,
        createdAt: material.created_at,
        updatedAt: material.updated_at
      }
    });

  } catch (error) {
    console.error('Get material summary error:', error);
    res.status(500).json({ error: 'Failed to get material summary' });
  }
});

// Helper function to check course access
async function checkCourseAccess(course, userId) {
  if (course.instructor_id === userId) return true;
  
  if (course.is_published) {
    // Check if user is enrolled
    const { supabase } = await import('../lib/supabase.js');
    const { data } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', course.id)
      .single();

    return !!data;
  }
  
  return false;
}

function sanitizeFilename(filename) {
  // Remove or replace characters not allowed in HTTP headers and non-ASCII
  // Common problematic chars: line breaks (\r, \n), double quotes, backslashes, control chars, non-ASCII
  // Replace all non-printable ASCII and non-ASCII chars with underscore
  return filename
    .replace(/[\r\n"]/g, '')                     // Remove line breaks and double quotes
    .replace(/[<>:\\\/|?*\x00-\x1F\x7F-\x9F]/g, '_') // Control chars and problematic specials
    .replace(/[^\x20-\x7E]/g, '_');              // Non-ASCII replaced with _
}

router.get('/:materialId/download-summary', authenticate, async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const material = await Material.findById(materialId);

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check if user has access to the course
    const course = await Course.findById(material.course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const hasAccess = await checkCourseAccess(course, req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const summary = material.edited_summary || material.summary;
    if (!summary) {
      return res.status(404).json({ error: 'No summary available for this material' });
    }

    // Construct filename: course title - material title Summary.txt with sanitization
    const safeCourseTitle = sanitizeFilename(course.title || 'unknown-course');
    const safeMaterialTitle = sanitizeFilename(material.title || 'unknown-material');
    const filename = `${safeCourseTitle} - ${safeMaterialTitle} Summary.txt`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain');
    res.send(summary);

  } catch (error) {
    console.error('Download material summary error:', error);
    res.status(500).json({ error: 'Failed to download material summary' });
  }
});

export default router;
