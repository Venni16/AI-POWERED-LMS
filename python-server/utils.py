def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> list:
    chunks = []
    start = 0
    text_length = len(text)
    
    # If text is shorter than chunk_size, return as single chunk
    if text_length <= chunk_size:
        return [text]
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
        
        # Prevent infinite loop
        if start >= text_length:
            break

    return chunks

def chunked_summarize(text: str, summarize_func, max_chunk_size: int = 1500) -> str:
    if len(text) <= max_chunk_size:
        return summarize_func(text)
    
    text_chunks = chunk_text(text, chunk_size=max_chunk_size, overlap=200)
    print(f"Processing {len(text_chunks)} chunks...")
    
    partial_summaries = []
    for i, chunk in enumerate(text_chunks):
        print(f"Summarizing chunk {i+1}/{len(text_chunks)}...")
        summary = summarize_func(chunk)
        partial_summaries.append(summary)
    
    combined_summary_input = " ".join(partial_summaries)
    
    # Final summarization if combined text is still long
    if len(combined_summary_input) > max_chunk_size:
        print("Final summarization of combined chunks...")
        return summarize_func(combined_summary_input)
    
    return combined_summary_input