import axios from 'axios';

export class VideoProcessor {
  static async processVideo(videoId, videoUrl) {
    try {
      console.log(`Starting AI processing for video ${videoId} at ${videoUrl}`);

      // Download video from Supabase
      const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });

      // Create FormData for Python server
      const FormData = (await import('form-data')).default;
      const formData = new FormData();

      // Extract filename from URL or use default
      const urlParts = videoUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'video.mp4';

      formData.append('video', Buffer.from(response.data), {
        filename: filename,
        contentType: 'video/mp4'
      });

      // Send to Python server for processing
      const pythonResponse = await axios.post('http://localhost:8000/process-video', formData, {
        headers: {
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      const { summary, transcript, processing_time } = pythonResponse.data;

      // Update video record with results
      const { Video } = await import('../models/Video.js');
      await Video.updateStatus(videoId, 'completed', {
        transcript,
        summary,
        processingTime: processing_time
      });

      console.log(`Video ${videoId} processing completed successfully`);
      return { success: true, summary, transcript };

    } catch (error) {
      console.error(`Error processing video ${videoId}:`, error);

      // Update video status to failed
      const { Video } = await import('../models/Video.js');
      await Video.updateStatus(videoId, 'failed');

      throw error;
    }
  }
}

export async function processVideoWithAI(videoId, videoUrl) {
  // Run in background
  setImmediate(() => {
    VideoProcessor.processVideo(videoId, videoUrl).catch(console.error);
  });
}
