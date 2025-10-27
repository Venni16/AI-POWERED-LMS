import express from 'express';
import { FileUpload, upload } from '../utils/fileUpload.js';
import { Video } from '../models/Video.js';
import { Course } from '../models/Course.js';
import { authenticate } from '../middleware/auth.js';
import { processVideoWithAI } from '../utils/videoProcessor.js';

const router = express.Router();

// Upload and process video
const uploadFields = upload.fields([{ name: 'video', maxCount: 1 }, { name: 'title' }, { name: 'courseId' }]);
router.post('/process', authenticate, uploadFields, async (req, res) => {
  try {
    console.log('Video upload route called');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request file:', req.files?.video ? {
      originalname: req.files.video[0].originalname,
      mimetype: req.files.video[0].mimetype,
      size: req.files.video[0].size,
      hasBuffer: !!req.files.video[0].buffer
    } : 'No file');

    if (!req.files?.video) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { courseId, title } = req.body;

    // Check if user is instructor of the course
    const course = await Course.findById(courseId);
    if (!course || course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Starting Supabase upload...');
    // Upload to Supabase
    const uploadResult = await FileUpload.uploadVideo(req.files.video[0], courseId, title);
    console.log('Upload result:', uploadResult);

    // Create video record
    const video = await Video.create({
      title: title || req.files.video[0].originalname,
      ...uploadResult,
      courseId: courseId,
      status: 'processing'
    });

    // Process with AI in background
    processVideoWithAI(video.id, uploadResult.publicUrl);

    res.json({
      success: true,
      videoId: video.id,
      message: 'Video uploaded and processing started'
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Get video stream URL
router.get('/:videoId/stream', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if user has access to the course
    const course = await Course.findById(video.course_id);
    const hasAccess = await checkCourseAccess(course, req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get signed URL for secure access
    const signedUrl = await FileUpload.getSignedUrl(video.storage_path, 3600); // 1 hour expiry

    res.json({
      success: true,
      url: signedUrl,
      video: {
        id: video.id,
        title: video.title,
        fileType: video.file_type
      }
    });

  } catch (error) {
    console.error('Video stream error:', error);
    res.status(500).json({ error: 'Failed to get video stream' });
  }
});

// Get public URL for video (for direct access)
router.get('/:videoId/public-url', async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get public URL directly from Supabase
    const { supabase } = await import('../lib/supabase.js');
    const { data: { publicUrl } } = supabase.storage
      .from('course-content')
      .getPublicUrl(video.storage_path);

    console.log('Generated public URL for video:', video.id, publicUrl);

    res.json({
      success: true,
      url: publicUrl,
      video: {
        id: video.id,
        title: video.title,
        fileType: video.file_type
      }
    });

  } catch (error) {
    console.error('Video public URL error:', error);
    res.status(500).json({ error: 'Failed to get video public URL' });
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

export default router;