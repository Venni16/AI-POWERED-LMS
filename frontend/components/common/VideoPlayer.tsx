import { useState, useEffect, useRef } from 'react';
import { PlayCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  courseId?: string;
  onVideoComplete?: (videoId: string) => void;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function VideoPlayer({ videoId, courseId, onVideoComplete }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchVideoUrl();
    setHasCompleted(false); // Reset completion status when video changes
  }, [videoId]);

  const fetchVideoUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      // Note: This component relies on the backend API structure defined in lib/api.ts
      const response = await fetch(`${backendUrl}/api/video/${videoId}/public-url`);
      const data = await response.json();

      if (data.success) {
        setVideoUrl(data.url);
      } else {
        setError('Failed to load video URL');
      }
    } catch (err) {
      console.error('Error fetching video URL:', err);
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const markVideoAsCompleted = async () => {
    if (!courseId || hasCompleted) return;

    try {
      // Note: This component relies on the backend API structure defined in lib/api.ts
      const response = await fetch(`http://localhost:5000/api/student/courses/${courseId}/videos/${videoId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setHasCompleted(true);
        onVideoComplete?.(videoId);
      } else {
        console.error('Failed to mark video as completed:', data.error);
      }
    } catch (error) {
      console.error('Error marking video as completed:', error);
    }
  };

  const handleVideoEnded = () => {
    markVideoAsCompleted();
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !hasCompleted) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;

      // Mark as completed if watched 90% or more
      if (duration > 0 && (currentTime / duration) >= 0.9) {
        markVideoAsCompleted();
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <div className="text-white ml-3">Loading video...</div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center rounded-lg">
        <div className="text-center p-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <div className="text-red-400 text-lg font-medium">Playback Error</div>
          <div className="text-sm text-gray-400">{error || 'Video source not available.'}</div>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl}
      controls
      className="w-full aspect-video object-contain bg-black rounded-lg"
      crossOrigin="anonymous"
      onEnded={handleVideoEnded}
      onTimeUpdate={handleTimeUpdate}
      onError={(e) => {
        // Basic error handling for video element itself
        console.error('Video element error:', e);
        setError('Video playback failed. Trying alternative source...');
        // Note: The parent component (CourseDetailPage) handles complex source switching.
      }}
    >
      Your browser does not support the video tag.
    </video>
  );
}