from transformers import pipeline, AutoTokenizer
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Global summarizer instance for better performance
_summarizer = None
_tokenizer = None

def get_summarizer(model_name: str = "facebook/bart-large-cnn"):
    """Get or create summarizer instance with caching"""
    global _summarizer, _tokenizer
    
    if _summarizer is None:
        try:
            _summarizer = pipeline(
                "summarization", 
                model=model_name,
                tokenizer=model_name
            )
            _tokenizer = AutoTokenizer.from_pretrained(model_name)
            logger.info(f"Summarizer model {model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load summarizer: {e}")
            raise
    
    return _summarizer, _tokenizer

def summarize_text(
    text: str,
    model_name: str = "facebook/bart-large-cnn",
    max_length: int = 500,
    min_length: int = 200,
    compression_ratio: Optional[float] = None
) -> str:
    """
    Summarize text using transformer models with enhanced error handling
    """
    try:
        summarizer, tokenizer = get_summarizer(model_name)
        
        # If text is too short, return as is
        if len(text.split()) < 30:
            return text
        
        # Calculate appropriate lengths
        word_count = len(text.split())
        
        if compression_ratio:
            max_length = min(max_length, int(word_count * compression_ratio))
            min_length = min(min_length, max_length // 2)
        else:
            # Adaptive length calculation
            if word_count < 100:
                max_length = min(100, word_count - 10)
                min_length = max(30, max_length // 2)
            elif word_count < 500:
                max_length = min(150, word_count // 3)
                min_length = max(50, max_length // 2)
            else:
                max_length = min(max_length, word_count // 4)
                min_length = min(min_length, max_length // 3)
        
        # Ensure min_length < max_length
        min_length = min(min_length, max_length - 1)
        
        # Tokenize to check length
        tokens = tokenizer.encode(text)
        if len(tokens) > tokenizer.model_max_length:
            # Truncate if too long
            tokens = tokens[:tokenizer.model_max_length - 100]
            text = tokenizer.decode(tokens, skip_special_tokens=True)
        
        logger.info(f"Summarizing text: {word_count} words -> {max_length} max tokens")
        
        summary = summarizer(
            text, 
            max_length=max_length, 
            min_length=min_length, 
            do_sample=False,
            truncation=True,
            clean_up_tokenization_spaces=True
        )
        
        result = summary[0]['summary_text'].strip()
        
        if not result or len(result.split()) < 3:
            raise ValueError("Generated summary is too short or empty")
            
        return result
        
    except Exception as e:
        logger.error(f"Summarization error: {e}")
        # Enhanced fallback: extract key sentences
        return extract_key_sentences(text, min(3, max_length // 50))

def extract_key_sentences(text: str, num_sentences: int = 3) -> str:
    """
    Fallback method to extract key sentences when summarization fails
    """
    sentences = text.split('.')
    meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    if not meaningful_sentences:
        return text[:500] + "..." if len(text) > 500 else text
    
    # Simple heuristic: take first, middle, and last sentences
    if len(meaningful_sentences) <= num_sentences:
        return '. '.join(meaningful_sentences) + '.'
    
    key_indices = [0]  # First sentence
    
    # Add a middle sentence
    if len(meaningful_sentences) > 2:
        key_indices.append(len(meaningful_sentences) // 2)
    
    # Add last sentence
    key_indices.append(len(meaningful_sentences) - 1)
    
    key_sentences = [meaningful_sentences[i] for i in key_indices[:num_sentences]]
    return '. '.join(key_sentences) + '.'