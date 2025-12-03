from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
import aiofiles
from datetime import datetime
import traceback
import logging
from typing import List, Optional

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Material Summarizer API")

FRONTEND_URL = os.getenv('http://localhost:3000')
BACKEND_URL = os.getenv('http://localhost:5000')

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["FRONTEND_URL, BACKEND_URL"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import processing functions
try:
    from document_parser import parse_document
    from summarizer import summarize_text
    from utils import chunked_summarize
    DEPENDENCIES_LOADED = True
    logger.info("All AI dependencies loaded successfully")
except ImportError as e:
    logger.error(f"Import error: {e}")
    DEPENDENCIES_LOADED = False

@app.get("/")
async def root():
    return {"message": "Material Summarizer API", "status": "running"}

@app.get("/health")
async def health_check():
    status = "healthy" if DEPENDENCIES_LOADED else "missing_dependencies"
    return {
        "status": status,
        "service": "material-summarizer",
        "dependencies_loaded": DEPENDENCIES_LOADED
    }

@app.post("/summarize-document")
async def summarize_document(
    file: UploadFile = File(...),
    max_summary_length: Optional[int] = 1000,
    chunk_size: Optional[int] = 1500
):
    """
    Summarize uploaded document (PDF, DOCX, TXT, etc.)
    """
    if not DEPENDENCIES_LOADED:
        raise HTTPException(
            status_code=500,
            detail="Required AI dependencies not loaded. Check server logs."
        )

    temp_file_path = None

    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.pptx', '.ppt'}
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported document format. Allowed: {', '.join(allowed_extensions)}"
            )

        # Create temporary file
        temp_file_path = f"temp_{file.filename}"

        # Save uploaded file
        logger.info(f"Saving uploaded file: {file.filename}")
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        start_time = datetime.now()

        # 1. Parse document
        logger.info("Step 1: Parsing document...")
        if not os.path.exists(temp_file_path):
            raise HTTPException(status_code=500, detail="Document file not found after upload")

        document_text = parse_document(temp_file_path, file_extension)
        logger.info(f"Extracted text length: {len(document_text)} characters")

        if not document_text or len(document_text.strip()) < 10:
            raise HTTPException(status_code=500, detail="Document parsing failed or content too short")

        # 2. Summarize text with chunking
        logger.info("Step 2: Generating summary...")
        
        def custom_summarize_func(text):
            return summarize_text(
                text, 
                model_name="facebook/bart-large-cnn",
                max_length=max_summary_length,
                min_length=min(100, max_summary_length // 3)
            )

        final_summary = chunked_summarize(
            text=document_text,
            summarize_func=custom_summarize_func,
            max_chunk_size=chunk_size
        )

        if not final_summary or len(final_summary.strip()) < 10:
            raise HTTPException(status_code=500, detail="Summary generation failed")

        processing_time = (datetime.now() - start_time).total_seconds()

        logger.info(f"Summarization completed in {processing_time:.2f} seconds")

        return {
            "success": True,
            "summary": final_summary,
            "original_length": len(document_text),
            "summary_length": len(final_summary),
            "processing_time": processing_time,
            "file_type": file_extension
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )
    finally:
        # Cleanup temporary files
        try:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.info(f"Cleaned up: {temp_file_path}")
        except Exception as cleanup_error:
            logger.error(f"Cleanup error: {cleanup_error}")

@app.post("/batch-summarize")
async def batch_summarize_documents(files: List[UploadFile] = File(...)):
    """
    Summarize multiple documents in batch
    """
    if not DEPENDENCIES_LOADED:
        raise HTTPException(
            status_code=500,
            detail="Required AI dependencies not loaded. Check server logs."
        )

    results = []
    
    for file in files:
        try:
            # Use the single document summarization function
            result = await summarize_document(file)
            result["filename"] = file.filename
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "success": True,
        "processed_files": len(results),
        "results": results
    }

if __name__ == "__main__":
    logger.info("Starting Material Summarizer Server...")
    logger.info("Dependencies loaded: %s", DEPENDENCIES_LOADED)

    if not DEPENDENCIES_LOADED:
        logger.error("CRITICAL: AI dependencies not loaded. Document processing will not work!")

    port = int(os.environ.get("MATERIAL_PORT", 7861))
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )