import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import fs from 'fs/promises';
import { authenticate, authorize, createAuditLog } from '../middleware/auth.js';
import { Course } from '../models/Course.js';
import { Video } from '../models/Video.js';
import { Material } from '../models/Material.js';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/materials/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'material-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({ 
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const materialUpload = multer({ 
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Background video processing function
const processVideoInBackground = async (videoId, videoPath) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
    
    // Read the video file
    const videoBuffer = await fs.readFile(videoPath);
    
    const formData = new FormData();
    const blob = new Blob([videoBuffer], { type: video.fileType });
    formData.append('video', blob, video.filename);

    console.log(`Processing video ${videoId} with AI...`);
    
    const response = await axios.post(`${pythonServerUrl}/process-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout
    });

    // Update video with AI results
    await Video.updateStatus(videoId, 'completed', {
      transcript: response.data.transcript,
      summary: response.data.summary,
      processing_time: response.data.processing_time
    });

    console.log(`Video ${videoId} processed successfully`);

    // Clean up uploaded file
    await fs.unlink(videoPath);

  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    
    // Update video status to error
    await Video.updateStatus(videoId, 'error');
  }
};

// Apply auth middleware to all routes
router.use(authenticate);
router.use(authorize('instructor'));

// Get existing categories
router.get('/categories', async (req, res) => {
  try {
    const { supabase } = await import('../lib/supabase.js');
    const { data: categories, error } = await supabase
      .from('courses')
      .select('category')
      .not('category', 'is', null)
      .neq('category', '');

    if (error) throw error;

    // Get unique categories and sort them
    const uniqueCategories = [...new Set(categories.map(c => c.category.trim()))]
      .filter(cat => cat.length > 0)
      .sort();

    res.json({ success: true, categories: uniqueCategories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get instructor courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.findByInstructor(req.user.id);

    // Transform courses to include _id for frontend compatibility and correct isPublished field
    const transformedCourses = courses.map(course => ({
      ...course,
      _id: course.id,
      isPublished: course.is_published,
      thumbnailUrl: course.thumbnail_url,
      enrollmentCount: course.enrollments?.length || 0,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      videos: course.videos?.map(video => ({
        ...video,
        editedSummary: video.edited_summary
      })) || []
    }));

    res.json({ success: true, courses: transformedCourses });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create course
router.post('/courses', async (req, res) => {
    try {
      const { title, description, category, price, thumbnail } = req.body;

      // Validate required fields
      if (!title || !description || !category) {
        return res.status(400).json({
          error: 'Title, description, and category are required'
        });
      }

      const courseData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        price: price ? parseFloat(price) : 0,
        thumbnail: thumbnail || '',
        instructor: req.user.id
      };

      const course = await Course.create(courseData);

      await createAuditLog(req, 'CREATE_COURSE', 'COURSE', {
        courseId: course.id,
        title: course.title
      });

      res.status(201).json({
        success: true,
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          price: course.price,
          thumbnail: course.thumbnail_url,
          instructor: req.user.id,
          isPublished: false, // New courses start as drafts
          enrollmentCount: course.enrollment_count,
          createdAt: course.created_at,
          updatedAt: course.updated_at
        }
      });

    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// Get course details
router.get('/courses/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor_id !== req.user.id) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Transform course to match frontend expectations
    const transformedCourse = {
      ...course,
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      thumbnail: course.thumbnail_url,
      isPublished: course.is_published,
      enrollmentCount: course.enrollments?.length || 0,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
      instructor: course.instructor,
      videos: course.videos?.map(video => ({
        ...video,
        editedSummary: video.edited_summary
      })) || [],
      materials: course.materials || []
    };

    res.json({ success: true, course: transformedCourse });

  } catch (error) {
    console.error('Get course details error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update course
router.put('/courses/:courseId', async (req, res) => {
  try {
    // Check if course exists and belongs to instructor
    const existingCourse = await Course.findById(req.params.courseId);
    if (!existingCourse || existingCourse.instructor_id !== req.user.id) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = await Course.update(req.params.courseId, req.body);

    await createAuditLog(req, 'UPDATE_COURSE', 'COURSE', { courseId: course.id });

    res.json({ success: true, course });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload video to course
router.post('/courses/:courseId/videos', videoUpload.single('video'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor_id !== req.user.id) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoData = {
      title: req.body.title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      courseId: course.id,
      status: 'processing',
      storagePath: req.file.path
    };

    const video = await Video.create(videoData);

    await createAuditLog(req, 'UPLOAD_VIDEO', 'VIDEO', {
      courseId: course.id, videoId: video.id
    });

    // Process video with AI in background
    processVideoInBackground(video.id, req.file.path);

    res.status(201).json({
      success: true,
      video: video,
      message: 'Video uploaded. AI processing started...'
    });

  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload material to course
router.post('/courses/:courseId/materials', materialUpload.single('material'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor_id !== req.user.id) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const materialData = {
      title: req.body.title || req.file.originalname,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      courseId: course.id,
      storagePath: req.file.path
    };

    const material = await Material.create(materialData);

    await createAuditLog(req, 'UPLOAD_MATERIAL', 'MATERIAL', {
      courseId: course.id, materialId: material.id
    });

    res.status(201).json({ success: true, material });

  } catch (error) {
    console.error('Upload material error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get enrolled students for a course
router.get('/courses/:courseId/students', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course || course.instructor_id !== req.user.id) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get enrollments for this course
    const { supabase } = await import('../lib/supabase.js');
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        enrolled_at,
        student:users(id, name, email, avatar_url)
      `)
      .eq('course_id', req.params.courseId);

    if (error) throw error;

    res.json({ success: true, students: enrollments });

  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete video from course
router.delete('/courses/:courseId/videos/:videoId', async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);

      if (!course || course.instructor_id !== req.user.id) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const video = await Video.findById(req.params.videoId);

      if (!video || video.course_id !== req.params.courseId) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Delete video file from Supabase storage
      if (video.storage_path) {
        try {
          const { FileUpload } = await import('../utils/fileUpload.js');
          await FileUpload.deleteFile(video.storage_path);
          console.log('Video deleted from Supabase storage:', video.storage_path);
        } catch (storageError) {
          console.error('Error deleting video from Supabase:', storageError);
          // Continue with deletion even if storage deletion fails
        }
      }

      // Delete video file from local uploads (if exists)
      const videoPath = path.join('uploads/videos', video.filename);
      try {
        await fs.unlink(videoPath);
      } catch (fileError) {
        console.error('Error deleting local video file:', fileError);
      }

      // Delete video record from database
      await Video.delete(req.params.videoId);

      await createAuditLog(req, 'DELETE_VIDEO', 'VIDEO', {
        courseId: course.id, videoId: video.id
      });

      res.json({
        success: true,
        message: 'Video deleted successfully'
      });

    } catch (error) {
      console.error('Delete video error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// Update video summary
router.put('/courses/:courseId/videos/:videoId/summary', async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);

      if (!course || course.instructor_id !== req.user.id) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const video = await Video.findById(req.params.videoId);

      if (!video || video.course_id !== req.params.courseId) {
        return res.status(404).json({ error: 'Video not found' });
      }

      const { summary } = req.body;

      if (!summary) {
        return res.status(400).json({ error: 'Summary is required' });
      }

      await Video.updateSummary(req.params.videoId, summary);

      await createAuditLog(req, 'UPDATE_SUMMARY', 'VIDEO', {
        courseId: course.id, videoId: video.id
      });

      const updatedVideo = await Video.findById(req.params.videoId);
      res.json({
        success: true,
        video: updatedVideo
      });

    } catch (error) {
      console.error('Update summary error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// Delete material from course
router.delete('/courses/:courseId/materials/:materialId', async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);

      if (!course || course.instructor_id !== req.user.id) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const material = await Material.findById(req.params.materialId);

      if (!material || material.course_id !== req.params.courseId) {
        return res.status(404).json({ error: 'Material not found' });
      }

      // Delete material file from Supabase storage
      if (material.storage_path) {
        try {
          const { FileUpload } = await import('../utils/fileUpload.js');
          await FileUpload.deleteFile(material.storage_path);
          console.log('Material deleted from Supabase storage:', material.storage_path);
        } catch (storageError) {
          console.error('Error deleting material from Supabase:', storageError);
          // Continue with deletion even if storage deletion fails
        }
      }

      // Delete material file from local uploads (if exists)
      const materialPath = path.join('uploads/materials', material.filename);
      try {
        await fs.unlink(materialPath);
      } catch (fileError) {
        console.error('Error deleting local material file:', fileError);
      }

      // Delete material record from database
      await Material.delete(req.params.materialId);

      await createAuditLog(req, 'DELETE_MATERIAL', 'MATERIAL', {
        courseId: course.id, materialId: material.id
      });

      res.json({
        success: true,
        message: 'Material deleted successfully'
      });

    } catch (error) {
      console.error('Delete material error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

// Delete course
router.delete('/courses/:courseId', async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId);

      if (!course || course.instructor_id !== req.user.id) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Check if course has enrolled students
      if (course.enrollments && course.enrollments.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete course with enrolled students. Please unenroll all students first.'
        });
      }

      // Delete all videos and their files
      if (course.videos && course.videos.length > 0) {
        for (const video of course.videos) {
          try {
            // Delete video file from Supabase storage
            if (video.storage_path) {
              const { FileUpload } = await import('../utils/fileUpload.js');
              await FileUpload.deleteFile(video.storage_path);
            }

            // Delete video file from local uploads
            const videoPath = path.join('uploads/videos', video.filename);
            try {
              await fs.unlink(videoPath);
            } catch (fileError) {
              console.error('Error deleting local video file:', fileError);
            }

            // Delete video record
            await Video.delete(video.id);
          } catch (videoError) {
            console.error(`Error deleting video ${video.id}:`, videoError);
            // Continue with other videos
          }
        }
      }

      // Delete all materials and their files
      if (course.materials && course.materials.length > 0) {
        for (const material of course.materials) {
          try {
            // Delete material file from Supabase storage
            if (material.storage_path) {
              const { FileUpload } = await import('../utils/fileUpload.js');
              await FileUpload.deleteFile(material.storage_path);
            }

            // Delete material file from local uploads
            const materialPath = path.join('uploads/materials', material.filename);
            try {
              await fs.unlink(materialPath);
            } catch (fileError) {
              console.error('Error deleting local material file:', fileError);
            }

            // Delete material record
            await Material.delete(material.id);
          } catch (materialError) {
            console.error(`Error deleting material ${material.id}:`, materialError);
            // Continue with other materials
          }
        }
      }

      // Delete course record
      await Course.delete(req.params.courseId);

      await createAuditLog(req, 'DELETE_COURSE', 'COURSE', {
        courseId: course.id,
        title: course.title
      });

      res.json({
        success: true,
        message: 'Course deleted successfully'
      });

    } catch (error) {
      console.error('Delete course error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });


// Use default export
export default router;
