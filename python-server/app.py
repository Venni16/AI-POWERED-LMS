from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
import aiofiles
from datetime import datetime
import traceback
import logging
from typing import List, Dict, Any
import httpx

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Video Summarizer API")

# Load environment variables
import os
from dotenv import load_dotenv
load_dotenv()

# Get URLs from environment
FRONTEND_URL = os.getenv('FRONTEND_URL')
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:5000')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, BACKEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import processing functions with error handling
try:
    from transcriber import extract_audio, transcribe_audio
    from summarizer import summarize_text
    from recommendation import recommend_courses
    from utils import chunked_summarize
    DEPENDENCIES_LOADED = True
    logger.info("All AI dependencies loaded successfully")
except ImportError as e:
    logger.error(f"Import error: {e}")
    DEPENDENCIES_LOADED = False

@app.get("/")
async def root():
    return {"message": "Video Summarizer API", "status": "running"}

@app.get("/health")
async def health_check():
    status = "healthy" if DEPENDENCIES_LOADED else "missing_dependencies"
    return {
        "status": status,
        "service": "python-video-processor",
        "dependencies_loaded": DEPENDENCIES_LOADED
    }

@app.post("/process-video")
async def process_video(video: UploadFile = File(...)):
    if not DEPENDENCIES_LOADED:
        raise HTTPException(
            status_code=500,
            detail="Required AI dependencies not loaded. Check server logs."
        )

    temp_video_path = None
    audio_path = "temp_audio.wav"

    try:
        # Validate file type
        allowed_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv'}
        file_extension = os.path.splitext(video.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid video format. Allowed: {', '.join(allowed_extensions)}"
            )

        # Create temporary file
        temp_video_path = f"temp_{video.filename}"

        # Save uploaded file
        logger.info(f"Saving uploaded file: {video.filename}")
        async with aiofiles.open(temp_video_path, 'wb') as out_file:
            content = await video.read()
            await out_file.write(content)

        start_time = datetime.now()

        # 1. Extract audio
        logger.info("Step 1: Extracting audio from video...")
        if not os.path.exists(temp_video_path):
            raise HTTPException(status_code=500, detail="Video file not found after upload")

        extract_audio(temp_video_path, audio_path)

        if not os.path.exists(audio_path):
            raise HTTPException(status_code=500, detail="Audio extraction failed")

        # 2. Transcribe audio
        logger.info("Step 2: Transcribing audio...")
        transcript = transcribe_audio(audio_path, model_size="base")
        logger.info(f"Transcript length: {len(transcript)} characters")

        if not transcript or len(transcript.strip()) < 10:
            raise HTTPException(status_code=500, detail="Transcription failed or too short")

        # 3. Summarize text with chunking
        logger.info("Step 3: Generating summary...")
        final_summary = chunked_summarize(
            text=transcript,
            summarize_func=lambda text: summarize_text(text, model_name="facebook/bart-large-cnn"),
            max_chunk_size=1500
        )

        if not final_summary or len(final_summary.strip()) < 10:
            raise HTTPException(status_code=500, detail="Summary generation failed")

        processing_time = (datetime.now() - start_time).total_seconds()

        logger.info(f"Processing completed in {processing_time:.2f} seconds")

        return {
            "success": True,
            "summary": final_summary,
            "transcript": transcript,
            "processing_time": processing_time
        }

    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

    finally:
        # Cleanup temporary files
        try:
            if temp_video_path and os.path.exists(temp_video_path):
                os.remove(temp_video_path)
                logger.info(f"Cleaned up: {temp_video_path}")
            if os.path.exists(audio_path):
                os.remove(audio_path)
                logger.info(f"Cleaned up: {audio_path}")
        except Exception as cleanup_error:
            logger.error(f"Cleanup error: {cleanup_error}")

@app.post("/recommend-courses")
async def get_course_recommendations(
    enrolled_courses: List[Dict[str, Any]],
    all_courses: List[Dict[str, Any]],
    top_n: int = Query(5, description="Number of recommendations to return")
):
    """
    Get course recommendations based on enrolled courses using AI semantic similarity
    """
    if not DEPENDENCIES_LOADED:
        raise HTTPException(
            status_code=500,
            detail="Required AI dependencies not loaded. Check server logs."
        )

    try:
        logger.info(f"Generating recommendations for {len(enrolled_courses)} enrolled courses from {len(all_courses)} total courses")

        recommended_ids = recommend_courses(enrolled_courses, all_courses, top_n)

        # Get the recommended course details
        recommended_courses = [course for course in all_courses if course['id'] in recommended_ids]

        logger.info(f"Successfully generated {len(recommended_courses)} recommendations")

        return {
            "success": True,
            "recommendations": recommended_courses,
            "count": len(recommended_courses)
        }

    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation generation failed: {str(e)}"
        )

if __name__ == "__main__":
    logger.info("Starting Python Video Summarizer Server...")
    logger.info("Dependencies loaded: %s", DEPENDENCIES_LOADED)

    if not DEPENDENCIES_LOADED:
        logger.error("CRITICAL: AI dependencies not loaded. Video processing will not work!")
        logger.error("Please check that whisper-openai, transformers, and torch are installed.")

    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )
