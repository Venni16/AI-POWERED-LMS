import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoId: string;
}

export default function VideoPlayer({ videoId }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoUrl();
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
      src={videoUrl || undefined}
      controls
      className="w-full h-48 object-contain"
      crossOrigin="anonymous"
    >
      Your browser does not support the video tag.
    </video>
  );
}
