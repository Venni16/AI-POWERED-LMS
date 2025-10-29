import { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoId: string;
  courseId?: string;
  onVideoComplete?: (videoId: string) => void;
}

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

      const response = await fetch(`http://localhost:5000/api/video/${videoId}/public-url`);
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
      <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
        <div className="text-white">Loading video...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <div>❌</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={videoUrl || undefined}
      controls
      className="w-full h-48 object-contain"
      crossOrigin="anonymous"
      onEnded={handleVideoEnded}
      onTimeUpdate={handleTimeUpdate}
    >
      Your browser does not support the video tag.
    </video>
  );
}
