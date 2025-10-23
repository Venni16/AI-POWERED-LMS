from transformers import pipeline

def summarize_text(text: str, model_name: str = "facebook/bart-large-cnn", max_length: int = 300, min_length: int = 100) -> str:
    try:
        summarizer = pipeline("summarization", model=model_name)
        
        # If text is too short, return as is
        if len(text.split()) < 50:
            return text
        
        # Calculate appropriate max_length based on input
        input_length = len(text.split())
        adjusted_max_length = min(max_length, input_length // 2)
        adjusted_min_length = min(min_length, adjusted_max_length // 3)
        
        summary = summarizer(
            text, 
            max_length=adjusted_max_length, 
            min_length=adjusted_min_length, 
            do_sample=False,
            truncation=True
        )
        return summary[0]['summary_text']
    except Exception as e:
        print(f"Summarization error: {e}")
        # Fallback: return the first part of the text
        sentences = text.split('.')
        return '. '.join(sentences[:3]) + '.'