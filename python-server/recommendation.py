from transformers import pipeline
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Initialize the sentence transformer model for semantic similarity
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
    MODEL_LOADED = True
    logger.info("Sentence transformer model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load sentence transformer model: {e}")
    MODEL_LOADED = False

def get_course_embeddings(courses):
    """Generate embeddings for course descriptions"""
    if not MODEL_LOADED:
        raise Exception("AI model not loaded")

    descriptions = [course['description'] for course in courses]
    embeddings = model.encode(descriptions)
    return embeddings

def get_related_categories(enrolled_categories):
    """
    Get related categories based on enrolled categories
    This creates a knowledge graph of related technologies
    """
    related_map = {
        'Full Stack': ['Web Development', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Tailwind', 'Bootstrap', 'PHP', 'Python', 'Django', 'Flask'],
        'Web Development': ['Full Stack', 'HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'Node.js', 'PHP', 'Python', 'Tailwind', 'Bootstrap'],
        'Frontend': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue', 'Angular', 'Tailwind', 'Bootstrap', 'TypeScript'],
        'Backend': ['Node.js', 'Express', 'Python', 'Django', 'Flask', 'PHP', 'Java', 'Spring', 'MongoDB', 'SQL', 'PostgreSQL', 'MySQL'],
        'AI/ML': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Data Science', 'Machine Learning', 'Deep Learning'],
        'Data Science': ['Python', 'R', 'SQL', 'Statistics', 'AI/ML', 'Machine Learning'],
        'Mobile Development': ['React Native', 'Flutter', 'iOS', 'Android', 'JavaScript', 'Dart'],
        'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'Linux', 'CI/CD', 'Jenkins', 'Git'],
        'Cybersecurity': ['Network Security', 'Ethical Hacking', 'Cryptography', 'Linux', 'Python'],
        'Blockchain': ['Cryptocurrency', 'Smart Contracts', 'Solidity', 'Web3', 'Ethereum'],
        # Add more relationships as needed
        'HTML': ['CSS', 'JavaScript', 'Web Development', 'Full Stack', 'Frontend'],
        'CSS': ['HTML', 'JavaScript', 'Tailwind', 'Bootstrap', 'Web Development', 'Full Stack', 'Frontend'],
        'JavaScript': ['HTML', 'CSS', 'React', 'Node.js', 'Web Development', 'Full Stack', 'Frontend'],
        'React': ['JavaScript', 'Web Development', 'Full Stack', 'Frontend', 'TypeScript'],
        'Node.js': ['JavaScript', 'Express', 'MongoDB', 'Web Development', 'Full Stack', 'Backend'],
        'Python': ['Django', 'Flask', 'Data Science', 'AI/ML', 'Web Development', 'Full Stack', 'Backend'],
        'PHP': ['MySQL', 'Web Development', 'Full Stack', 'Backend'],
        'SQL': ['MySQL', 'PostgreSQL', 'Database', 'Web Development', 'Full Stack', 'Backend', 'Data Science'],
        'Tailwind': ['CSS', 'Web Development', 'Full Stack', 'Frontend'],
        'TypeScript': ['JavaScript', 'React', 'Web Development', 'Full Stack', 'Frontend']
    }

    related = set()
    for category in enrolled_categories:
        if category in related_map:
            related.update(related_map[category])

    # Remove any categories that are already enrolled in
    related = related - enrolled_categories

    return related

def recommend_courses(enrolled_courses, all_courses, top_n=5):
    """
    Recommend courses based on enrolled courses prioritizing category preferences and semantic similarity

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
        sorted_courses = sorted(all_courses, key=lambda x: x.get('enrollment_count', 0), reverse=True)
        return [course['id'] for course in sorted_courses[:top_n]]

    try:
        # Get enrolled categories and their related categories
        enrolled_categories = set(course['category'] for course in enrolled_courses)
        related_categories = get_related_categories(enrolled_categories)
        all_preferred_categories = enrolled_categories.union(related_categories)

        enrolled_ids = set(course['id'] for course in enrolled_courses)

        print(f"DEBUG: Enrolled categories: {enrolled_categories}")
        print(f"DEBUG: Related categories: {related_categories}")
        print(f"DEBUG: All preferred categories: {all_preferred_categories}")

        # First priority: courses from enrolled and related categories
        category_matches = [
            course for course in all_courses
            if course['category'] in all_preferred_categories and course['id'] not in enrolled_ids
        ]

        print(f"DEBUG: Found {len(category_matches)} courses in preferred categories")

        # Second priority: courses from other categories (if we need more recommendations)
        other_courses = [
            course for course in all_courses
            if course['category'] not in all_preferred_categories and course['id'] not in enrolled_ids
        ]

        # If we have enough category matches, prioritize them
        if len(category_matches) >= top_n:
            print("DEBUG: Using only preferred category matches")
            # Within category matches, use semantic similarity and popularity
            return rank_within_category(category_matches, enrolled_courses, all_courses, top_n)

        # Otherwise, combine category matches with some other courses
        remaining_slots = top_n - len(category_matches)
        print(f"DEBUG: Need {remaining_slots} more courses from other categories")

        other_ranked = rank_other_courses(other_courses, enrolled_courses, all_courses, remaining_slots)

        # Combine and return
        recommendations = category_matches[:len(category_matches)] + other_ranked
        return [course['id'] for course in recommendations[:top_n]]

    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        # Fallback: return courses from same categories, sorted by popularity
        enrolled_categories = set(course['category'] for course in enrolled_courses)
        enrolled_ids = set(course['id'] for course in enrolled_courses)

        category_matches = [
            course for course in all_courses
            if course['category'] in enrolled_categories and course['id'] not in enrolled_ids
        ]

        # Sort by enrollment count (popularity within same categories)
        category_matches.sort(key=lambda x: x.get('enrollment_count', 0), reverse=True)

        return [course['id'] for course in category_matches[:top_n]]

def rank_within_category(category_courses, enrolled_courses, all_courses, top_n):
    """Rank courses within the same categories using semantic similarity and popularity"""
    if not category_courses:
        return []

    try:
        # Get embeddings for category courses and enrolled courses
        category_embeddings = get_course_embeddings(category_courses)
        enrolled_embeddings = get_course_embeddings(enrolled_courses)

        # Calculate similarity scores
        similarity_scores = np.zeros(len(category_courses))

        for enrolled_embedding in enrolled_embeddings:
            similarities = cosine_similarity([enrolled_embedding], category_embeddings)[0]
            similarity_scores += similarities

        # Average similarity scores
        similarity_scores /= len(enrolled_courses)

        # Add popularity boost
        max_enrollments = max((course.get('enrollment_count', 0) for course in category_courses), default=1)
        popularity_boost_factor = 0.2

        for i, course in enumerate(category_courses):
            enrollment_ratio = course.get('enrollment_count', 0) / max_enrollments
            similarity_scores[i] += enrollment_ratio * popularity_boost_factor

        # Sort by combined score
        scored_courses = list(zip(category_courses, similarity_scores))
        scored_courses.sort(key=lambda x: x[1], reverse=True)

        return [course for course, _ in scored_courses[:top_n]]

    except Exception as e:
        logger.error(f"Error ranking within category: {e}")
        # Fallback: sort by popularity
        category_courses.sort(key=lambda x: x.get('enrollment_count', 0), reverse=True)
        return category_courses[:top_n]

def rank_other_courses(other_courses, enrolled_courses, all_courses, top_n):
    """Rank courses from other categories using semantic similarity"""
    if not other_courses or top_n <= 0:
        return []

    try:
        # Get embeddings
        other_embeddings = get_course_embeddings(other_courses)
        enrolled_embeddings = get_course_embeddings(enrolled_courses)

        # Calculate similarity scores
        similarity_scores = np.zeros(len(other_courses))

        for enrolled_embedding in enrolled_embeddings:
            similarities = cosine_similarity([enrolled_embedding], other_embeddings)[0]
            similarity_scores += similarities

        # Average similarity scores
        similarity_scores /= len(enrolled_courses)

        # Sort by similarity
        scored_courses = list(zip(other_courses, similarity_scores))
        scored_courses.sort(key=lambda x: x[1], reverse=True)

        return [course for course, _ in scored_courses[:top_n]]

    except Exception as e:
        logger.error(f"Error ranking other courses: {e}")
        # Fallback: sort by popularity
        other_courses.sort(key=lambda x: x.get('enrollment_count', 0), reverse=True)
        return other_courses[:top_n]
