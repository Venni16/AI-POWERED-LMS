export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  profile?: {
    bio?: string;
    avatar?: string;
    specialization?: string;
  };
  isActive?: boolean;
  createdAt?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: User;
  category: string;
  price: number;
  thumbnail?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  enrollmentCount: number;
  videos: Video[];
  materials: Material[];
  enrolledStudents: Enrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  _id?: string;
  title: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  duration?: number;
  transcript: string;
  summary: string;
  editedSummary: string;
  processingTime: number;
  status: 'processing' | 'completed' | 'error';
  course: string;
  uploadDate: string;
  studentProgress?: {
    completed: boolean;
    completedAt: string | null;
  };
}

export interface Material {
  id: string;
  _id?: string;
  title: string;
  filename: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  course: string;
  uploadDate: string;
}

export interface Enrollment {
  student: User;
  enrolledAt: string;
  enrolled_at?: string;
  progress?: number;
}

export interface AuditLog {
  _id: string;
  user: User;
  action: string;
  resource: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  totalCourses: number;
}

export interface ChatMessage {
  id: string;
  course_id: string;
  sender: User;
  message: string;
  created_at: string;
}
