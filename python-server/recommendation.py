from transformers import pipeline
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sentence_transformers import SentenceTransformer
import logging
from typing import List, Dict, Set, Tuple, Optional
import time
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the sentence transformer model for semantic similarity
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    MODEL_LOADED = True
    logger.info("Sentence transformer model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load sentence transformer model: {e}")
    MODEL_LOADED = False

# Embedding cache for performance
embedding_cache = {}
last_cache_clear = time.time()
CACHE_TTL = 3600  # Clear cache every hour

# Configurable weights for scoring
SCORING_WEIGHTS = {
    'semantic_similarity': 0.5,
    'popularity': 0.2,
    'category_relevance': 0.3  # Increased weight for category relevance
}

# Enhanced category relationships with case-insensitive matching
RELATED_CATEGORIES = {
    # Standardized category names (lowercase)
    'fullstack': {'web development': 1.0, 'frontend': 0.9, 'backend': 0.9, 'javascript': 0.8, 'react': 0.7, 'node.js': 0.7, 'php': 0.8},
    'full stack': {'web development': 1.0, 'frontend': 0.9, 'backend': 0.9, 'javascript': 0.8, 'react': 0.7, 'node.js': 0.7, 'php': 0.8},
    'php': {'web development': 0.9, 'backend': 0.8, 'fullstack': 0.7, 'mysql': 0.7, 'laravel': 0.6},
    'web development': {'fullstack': 1.0, 'frontend': 0.8, 'backend': 0.8, 'javascript': 0.9, 'html': 0.7, 'php': 0.8},
    'web dev': {'fullstack': 1.0, 'frontend': 0.8, 'backend': 0.8, 'javascript': 0.9, 'html': 0.7, 'php': 0.8},
    'frontend': {'web development': 0.9, 'html': 0.8, 'css': 0.8, 'javascript': 0.9, 'react': 0.8},
    'backend': {'web development': 0.9, 'node.js': 0.8, 'python': 0.7, 'database': 0.8, 'api': 0.7, 'php': 0.8},
    'cybersecurity': {'networking': 0.8, 'linux': 0.7, 'python': 0.6, 'ethical hacking': 0.9, 'security': 0.9},
    'cyber security': {'networking': 0.8, 'linux': 0.7, 'python': 0.6, 'ethical hacking': 0.9, 'security': 0.9},
    'aiml': {'python': 0.9, 'machine learning': 0.8, 'ai': 0.9, 'deep learning': 0.8, 'data science': 0.7},
    'ai/ml': {'python': 0.9, 'machine learning': 0.8, 'ai': 0.9, 'deep learning': 0.8, 'data science': 0.7},
    'ai ml': {'python': 0.9, 'machine learning': 0.8, 'ai': 0.9, 'deep learning': 0.8, 'data science': 0.7},
    'artificial intelligence': {'python': 0.9, 'machine learning': 0.8, 'ai': 0.9, 'deep learning': 0.8, 'data science': 0.7},
    'machine learning': {'data science': 0.9, 'python': 0.8, 'ai': 0.7, 'deep learning': 0.8},
    'data science': {'python': 0.9, 'machine learning': 0.8, 'statistics': 0.7, 'sql': 0.6},
    'mobile development': {'javascript': 0.7, 'react native': 0.9, 'flutter': 0.8, 'ios': 0.7},
    'devops': {'linux': 0.8, 'docker': 0.9, 'aws': 0.7, 'ci/cd': 0.8},
    'blockchain': {'javascript': 0.7, 'web3': 0.9, 'solidity': 0.8, 'cryptocurrency': 0.7},
    'javascript': {'web development': 0.9, 'frontend': 0.8, 'node.js': 0.7, 'react': 0.8},
    'python': {'data science': 0.8, 'backend': 0.7, 'machine learning': 0.8, 'automation': 0.6},
    'react': {'javascript': 0.9, 'frontend': 0.8, 'web development': 0.7},
    'reactjs': {'javascript': 0.9, 'frontend': 0.8, 'web development': 0.7},
    'node.js': {'javascript': 0.9, 'backend': 0.8, 'web development': 0.7},
    'nodejs': {'javascript': 0.9, 'backend': 0.8, 'web development': 0.7},
    'html': {'web development': 0.8, 'frontend': 0.9, 'css': 0.8},
    'css': {'web development': 0.8, 'frontend': 0.9, 'html': 0.8},
    'sql': {'database': 0.9, 'backend': 0.7, 'data science': 0.6},
    'java': {'backend': 0.8, 'spring': 0.9, 'enterprise': 0.7},
}

def normalize_category_name(category: str) -> str:
    """Normalize category name to lowercase and handle common variations"""
    if not category:
        return ""
    
    # Convert to lowercase and strip whitespace
    normalized = category.lower().strip()
    
    # Handle common variations
    variations = {
        'ai/ml': 'aiml',
        'ai ml': 'aiml',
        'artificial intelligence': 'aiml',
        'full stack': 'fullstack',
        'web dev': 'web development',
        'cyber security': 'cybersecurity',
        'nodejs': 'node.js',
        'reactjs': 'react'
    }
    
    return variations.get(normalized, normalized)

def _clear_old_cache():
    """Clear cache if TTL has expired"""
    global last_cache_clear
    current_time = time.time()
    if current_time - last_cache_clear > CACHE_TTL:
        embedding_cache.clear()
        last_cache_clear = current_time
        logger.info("Embedding cache cleared")

def get_course_embeddings_batch(courses: List[Dict]) -> Dict[str, np.ndarray]:
    """Generate embeddings for multiple courses with caching"""
    if not MODEL_LOADED:
        raise Exception("AI model not loaded")
    
    _clear_old_cache()
    
    # Find courses that need embedding
    courses_to_embed = []
    course_ids_to_embed = []
    
    for course in courses:
        course_id = course['id']
        if course_id not in embedding_cache:
            courses_to_embed.append(course)
            course_ids_to_embed.append(course_id)
    
    # Generate embeddings for new courses
    if courses_to_embed:
        descriptions = [course.get('description', '') or 'No description available' 
                      for course in courses_to_embed]
        
        logger.info(f"Generating embeddings for {len(courses_to_embed)} courses")
        embeddings = model.encode(descriptions)
        
        # Cache the new embeddings
        for course_id, embedding in zip(course_ids_to_embed, embeddings):
            embedding_cache[course_id] = embedding
    
    # Return all requested embeddings
    result = {}
    for course in courses:
        course_id = course['id']
        if course_id in embedding_cache:
            result[course_id] = embedding_cache[course_id]
    
    return result

def get_related_categories_with_scores(enrolled_categories: Set[str]) -> Dict[str, float]:
    """
    Get related categories with similarity scores based on enrolled categories
    """
    related_scores = {}
    
    for category in enrolled_categories:
        normalized_category = normalize_category_name(category)
        
        # Try exact match first
        if normalized_category in RELATED_CATEGORIES:
            for related_cat, score in RELATED_CATEGORIES[normalized_category].items():
                if related_cat not in enrolled_categories:
                    if related_cat in related_scores:
                        related_scores[related_cat] = max(related_scores[related_cat], score)
                    else:
                        related_scores[related_cat] = score
        else:
            # Try partial matching for unknown categories
            for known_category, relations in RELATED_CATEGORIES.items():
                if known_category in normalized_category or normalized_category in known_category:
                    for related_cat, score in relations.items():
                        if related_cat not in enrolled_categories:
                            if related_cat in related_scores:
                                related_scores[related_cat] = max(related_scores[related_cat], score * 0.7)  # Lower confidence for partial matches
                            else:
                                related_scores[related_cat] = score * 0.7
    
    return related_scores

def calculate_category_relevance(course_category: str, 
                               enrolled_categories: Set[str],
                               related_categories: Dict[str, float]) -> float:
    """Calculate how relevant a course category is to enrolled categories"""
    normalized_course_category = normalize_category_name(course_category)
    normalized_enrolled_categories = {normalize_category_name(cat) for cat in enrolled_categories}
    
    # Direct match with enrolled categories
    for enrolled_cat in normalized_enrolled_categories:
        if enrolled_cat in normalized_course_category or normalized_course_category in enrolled_cat:
            return 1.0
    
    # Check related categories
    for related_cat, score in related_categories.items():
        normalized_related_cat = normalize_category_name(related_cat)
        if normalized_related_cat in normalized_course_category or normalized_course_category in normalized_related_cat:
            return score
    
    return 0.0  # No relevance

def recommend_courses(enrolled_courses, all_courses, top_n=5):
    """
    Recommend courses based on enrolled courses using multi-factor scoring
    
    Args:
        enrolled_courses: List of courses the student is enrolled in
        all_courses: List of all available courses
        top_n: Number of recommendations to return

    Returns:
        List of recommended course IDs
    """
    if not MODEL_LOADED:
        raise Exception("AI model not loaded")
    
    if not enrolled_courses:
        # If no enrolled courses, return popular courses
        sorted_courses = sorted(all_courses, 
                              key=lambda x: x.get('enrollment_count', 0), 
                              reverse=True)
        return [course['id'] for course in sorted_courses[:top_n]]
    
    try:
        # Get enrolled categories and related categories with scores
        enrolled_categories = set(course['category'] for course in enrolled_courses)
        related_categories = get_related_categories_with_scores(enrolled_categories)
        enrolled_ids = set(course['id'] for course in enrolled_courses)
        
        logger.info(f"Enrolled categories: {enrolled_categories}")
        logger.info(f"Related categories: {list(related_categories.keys())}")
        
        # Filter out enrolled courses
        available_courses = [course for course in all_courses 
                           if course['id'] not in enrolled_ids]
        
        if not available_courses:
            logger.warning("No available courses to recommend")
            return []
        
        # Get embeddings for all courses in batch
        all_courses_for_embedding = enrolled_courses + available_courses
        embeddings = get_course_embeddings_batch(all_courses_for_embedding)
        
        # Calculate scores for each available course
        scored_courses = []
        enrolled_embeddings = [embeddings[course['id']] for course in enrolled_courses 
                             if course['id'] in embeddings]
        
        # Calculate popularity scores more robustly
        enrollment_counts = [course.get('enrollment_count', 0) for course in available_courses]
        max_enrollment = max(enrollment_counts) if enrollment_counts else 1
        min_enrollment = min(enrollment_counts) if enrollment_counts else 0
        
        for course in available_courses:
            if course['id'] not in embeddings:
                continue
                
            course_embedding = embeddings[course['id']]
            
            # Calculate semantic similarity
            semantic_score = 0.0
            if enrolled_embeddings:
                similarities = cosine_similarity([course_embedding], enrolled_embeddings)[0]
                semantic_score = float(np.mean(similarities))
            
            # Calculate robust popularity score (normalized 0-1)
            enrollment_count = course.get('enrollment_count', 0)
            if max_enrollment > min_enrollment:
                popularity_score = (enrollment_count - min_enrollment) / (max_enrollment - min_enrollment)
            else:
                popularity_score = 0.5  # Default if all courses have same enrollment
            
            # Calculate category relevance
            category_relevance = calculate_category_relevance(
                course['category'], enrolled_categories, related_categories
            )
            
            # Combined score with category relevance having more weight
            combined_score = (
                semantic_score * SCORING_WEIGHTS['semantic_similarity'] +
                popularity_score * SCORING_WEIGHTS['popularity'] +
                category_relevance * SCORING_WEIGHTS['category_relevance']
            )
            
            scored_courses.append((course, combined_score, semantic_score, popularity_score, category_relevance))
        
        # Sort by combined score
        scored_courses.sort(key=lambda x: x[1], reverse=True)
        
        # Apply diversity boost
        final_recommendations = _apply_diversity_boost(scored_courses, top_n)
        
        # Log recommendation details
        logger.info("=== Recommendation Details ===")
        for i, (course, combined_score, semantic_score, popularity_score, category_relevance) in enumerate(scored_courses[:top_n]):
            logger.info(f"{i+1}. {course['title']} (Category: {course['category']})")
            logger.info(f"   Score: {combined_score:.3f} (Semantic: {semantic_score:.3f}, Popularity: {popularity_score:.3f}, Category: {category_relevance:.3f})")
        
        return [course['id'] for course in final_recommendations]
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return _fallback_recommendations(enrolled_courses, all_courses, top_n)

def _apply_diversity_boost(scored_courses: List[Tuple], top_n: int) -> List[Dict]:
    """Ensure recommendations cover different categories"""
    selected_courses = []
    selected_categories = set()
    
    for course, combined_score, semantic_score, popularity_score, category_relevance in scored_courses:
        if len(selected_courses) >= top_n:
            break
            
        current_category = normalize_category_name(course['category'])
        
        # If we already have this category, skip unless it's highly relevant
        if current_category in selected_categories and category_relevance < 0.5:
            continue
            
        selected_courses.append(course)
        selected_categories.add(current_category)
    
    # If we don't have enough recommendations, add the highest scoring ones regardless of category
    if len(selected_courses) < top_n:
        remaining_slots = top_n - len(selected_courses)
        for course, combined_score, semantic_score, popularity_score, category_relevance in scored_courses:
            if course not in selected_courses:
                selected_courses.append(course)
                remaining_slots -= 1
                if remaining_slots <= 0:
                    break
    
    return selected_courses[:top_n]

def _fallback_recommendations(enrolled_courses: List[Dict], 
                            all_courses: List[Dict], top_n: int) -> List[str]:
    """Fallback recommendation strategy when main algorithm fails"""
    logger.info("Using fallback recommendation strategy")
    
    enrolled_categories = set(course['category'] for course in enrolled_courses)
    enrolled_ids = set(course['id'] for course in enrolled_courses)
    
    # Priority 1: Same categories, sorted by popularity
    category_matches = [
        course for course in all_courses
        if course['category'] in enrolled_categories and course['id'] not in enrolled_ids
    ]
    
    if len(category_matches) >= top_n:
        category_matches.sort(key=lambda x: x.get('enrollment_count', 0), reverse=True)
        return [course['id'] for course in category_matches[:top_n]]
    
    # Priority 2: Include related categories
    related_categories_map = get_related_categories_with_scores(enrolled_categories)
    related_matches = [
        course for course in all_courses
        if any(related_cat in course['category'] for related_cat in related_categories_map) and course['id'] not in enrolled_ids
    ]
    
    all_matches = category_matches + related_matches
    if all_matches:
        all_matches.sort(key=lambda x: x.get('enrollment_count', 0), reverse=True)
        return [course['id'] for course in all_matches[:top_n]]
    
    # Priority 3: Most popular courses overall
    available_courses = [course for course in all_courses if course['id'] not in enrolled_ids]
    available_courses.sort(key=lambda x: x.get('enrollment_count', 0), reverse=True)
    return [course['id'] for course in available_courses[:top_n]]

# Legacy functions for backward compatibility
def get_course_embeddings(courses):
    """Legacy function for backward compatibility"""
    return get_course_embeddings_batch(courses)

def get_related_categories(enrolled_categories):
    """Legacy function for backward compatibility"""
    related_scores = get_related_categories_with_scores(set(enrolled_categories))
    return list(related_scores.keys())

def rank_within_category(category_courses, enrolled_courses, all_courses, top_n):
    """Legacy function for backward compatibility - simplified version"""
    if not category_courses:
        return []
    
    # Use the main recommendation function but filter for category courses
    all_courses_filtered = [course for course in all_courses if course in category_courses]
    recommendations = recommend_courses(enrolled_courses, all_courses_filtered, top_n)
    
    # Convert back to course objects
    course_map = {course['id']: course for course in category_courses}
    return [course_map[course_id] for course_id in recommendations if course_id in course_map]

def rank_other_courses(other_courses, enrolled_courses, all_courses, top_n):
    """Legacy function for backward compatibility - simplified version"""
    if not other_courses or top_n <= 0:
        return []
    
    # Use the main recommendation function but filter for other courses
    all_courses_filtered = [course for course in all_courses if course in other_courses]
    recommendations = recommend_courses(enrolled_courses, all_courses_filtered, top_n)
    
    # Convert back to course objects
    course_map = {course['id']: course for course in other_courses}
    return [course_map[course_id] for course_id in recommendations if course_id in course_map]