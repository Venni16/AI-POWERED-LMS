import logging
from typing import List, Callable

logger = logging.getLogger(__name__)

def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
    """
    Split text into overlapping chunks for processing long documents
    """
    chunks = []
    start = 0
    text_length = len(text)
    
    # If text is shorter than chunk_size, return as single chunk
    if text_length <= chunk_size:
        return [text]
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        
        # Try to break at sentence boundary
        if end < text_length:
            # Look for sentence end in the last 100 characters of chunk
            sentence_end = max(
                text.rfind('. ', start, end),
                text.rfind('? ', start, end),
                text.rfind('! ', start, end)
            )
            if sentence_end > start + chunk_size * 0.7:  # Only if reasonable
                end = sentence_end + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        start = end - overlap if end - overlap > start else end
        
        # Prevent infinite loop
        if start >= text_length:
            break

    return chunks

def chunked_summarize(
    text: str, 
    summarize_func: Callable, 
    max_chunk_size: int = 1500,
    overlap: int = 200
) -> str:
    """
    Summarize long text by processing in chunks and combining results
    """
    if len(text) <= max_chunk_size:
        return summarize_func(text)
    
    text_chunks = chunk_text(text, chunk_size=max_chunk_size, overlap=overlap)
    logger.info(f"Processing {len(text_chunks)} chunks...")
    
    partial_summaries = []
    for i, chunk in enumerate(text_chunks):
        logger.info(f"Summarizing chunk {i+1}/{len(text_chunks)}...")
        try:
            summary = summarize_func(chunk)
            if summary and len(summary.strip()) > 10:
                partial_summaries.append(summary)
        except Exception as e:
            logger.warning(f"Failed to summarize chunk {i+1}: {e}")
            # Include original chunk as fallback
            partial_summaries.append(chunk[:200] + "...")
    
    if not partial_summaries:
        return "Unable to generate summary from the document."
    
    combined_summary_input = " ".join(partial_summaries)
    
    # Final summarization if combined text is still long
    if len(combined_summary_input) > max_chunk_size:
        logger.info("Final summarization of combined chunks...")
        try:
            return summarize_func(combined_summary_input)
        except Exception as e:
            logger.error(f"Final summarization failed: {e}")
            # Return the combined partial summaries
            return combined_summary_input
    
    return combined_summary_input

def estimate_reading_time(text: str, words_per_minute: int = 200) -> int:
    """
    Estimate reading time in minutes
    """
    word_count = len(text.split())
    return max(1, round(word_count / words_per_minute))