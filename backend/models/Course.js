import { supabase } from '../lib/supabase.js';

export class Course {
  static generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  static async create(courseData) {
    const slug = this.generateSlug(courseData.title);
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        title: courseData.title,
        slug: slug,
        description: courseData.description,
        instructor_id: courseData.instructor,
        category: courseData.category,
        price: courseData.price,
        thumbnail_url: courseData.thumbnail
      }])
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization),
        videos(*),
        materials(*),
        enrollments(
          enrolled_at,
          student:users(id, name, email, avatar_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Sort videos by created_at ascending (upload order)
    if (data.videos) {
      data.videos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    return data;
  }

  static async findBySlug(slug) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization),
        videos(*),
        materials(*),
        enrollments(
          enrolled_at,
          student:users(id, name, email, avatar_url)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) throw error;

    // Sort videos by created_at ascending (upload order)
    if (data.videos) {
      data.videos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    return data;
  }

  static async findByInstructor(instructorId) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization),
        videos(*),
        materials(*),
        enrollments(
          enrolled_at,
          student:users(id, name, email, avatar_url)
        )
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findPublished() {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization),
        videos(id),
        materials(id)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async findEnrolledByStudent(studentId) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
    course:courses(
      id,
      slug,
      title,
      description,
      category,
      price,
      thumbnail_url,
      is_published,
      enrollment_count,
      created_at,
      updated_at,
      instructor:users(id, name, email, avatar_url, specialization),
      videos(id, title, filename, original_name, file_size, file_type, duration, transcript, summary, edited_summary, processing_time, status, course_id, created_at),
      materials(id)
    )
      `)
      .eq('student_id', studentId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    // Get progress data for each course
    const coursesWithProgress = await Promise.all(
      data.map(async (item) => {
        const course = item.course;

        // Get student progress for this course's videos
        const { data: progressData, error: progressError } = await supabase
          .from('student_video_progress')
          .select('video_id, completed, completed_at')
          .eq('student_id', studentId)
          .eq('course_id', course.id);

        if (progressError) {
          console.error('Error fetching progress:', progressError);
        }

        // Add progress information to videos
        const videosWithProgress = course.videos?.map(video => {
          const progress = progressData?.find(p => p.video_id === video.id);
          return {
            ...video,
            studentProgress: progress ? {
              completed: progress.completed,
              completedAt: progress.completed_at
            } : {
              completed: false,
              completedAt: null
            }
          };
        }) || [];

        return {
          ...course,
          videos: videosWithProgress
        };
      })
    );

    return coursesWithProgress;
  }

  static async update(id, updates) {
    // Convert camelCase to snake_case for database columns
    const dbUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'isPublished') {
        dbUpdates.is_published = value;
      } else if (key === 'enrollmentCount') {
        dbUpdates.enrollment_count = value;
      } else if (key === 'createdAt') {
        dbUpdates.created_at = value;
      } else if (key === 'updatedAt') {
        dbUpdates.updated_at = value;
      } else {
        dbUpdates[key] = value;
      }
    }

    const { data, error } = await supabase
      .from('courses')
      .update(dbUpdates)
      .eq('id', id)
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async count() {
    const { count, error } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count;
  }

  static async search(query) {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users(id, name, email, avatar_url, specialization),
        videos(id),
        materials(id)
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}