import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatbotMessage } from '../models/ChatbotMessage.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Video } from '../models/Video.js';
import { Material } from '../models/Material.js';
import { Mcq } from '../models/Mcq.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export class AIChatbot {
  static async generateResponse(userId, userMessage) {
    let user = null;
    try {
      // Get user info for personalization
      user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Get conversation history (last 20 messages for context)
      const history = await ChatbotMessage.findByUser(userId, 20);

      // Get relevant LMS data based on user query
      const lmsData = await this.getRelevantLMSData(userId, userMessage, user.role);

      // Build context from history and LMS data
      let context = `You are Vortex AI, a helpful assistant for the Vortex Learning Management System (LMS). Your name is Vortex AI.

User Information:
- Name: ${user.name}
- Role: ${user.role}

Your responsibilities:
1. Only answer questions related to the LMS platform
2. Help with courses, materials, progress, enrollment, and how to use LMS features
3. Explain course concepts if asked
4. Help with navigation in Vortex LMS
5. Personalize responses using the user's name
6. Remember previous messages in the conversation
7. Be polite and helpful
8. Reject non-LMS queries politely
9. Use the provided LMS data to give accurate, specific information
10. Build natural conversations while staying focused on LMS topics
11. Keep responses concise and direct - focus on actionable steps
12. Reference specific UI elements and navigation paths
13. Provide step-by-step instructions for using LMS features

LMS Data Context:
${lmsData}

If the question is not related to LMS, respond politely saying you can only help with LMS-related questions.

Conversation History:
${history.map(msg => `${msg.is_ai ? 'Vortex AI' : user.name}: ${msg.message}`).join('\n')}

Current User Question: ${userMessage}

Please provide a helpful, personalized response as Vortex AI. Use the LMS data to give specific, accurate information when relevant. Keep responses concise and focus on UI navigation and feature usage:`;

      // Generate AI response - use gemini-pro which is available
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Retry logic for service unavailable errors
      let result;
      let retries = 3;
      while (retries > 0) {
        try {
          result = await model.generateContent(context);
          break;
        } catch (error) {
          if (error.status === 503 && retries > 1) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            continue;
          }
          throw error;
        }
      }

      const aiResponse = result.response.text().trim();

      // Filter response to ensure it's LMS-focused
      const filteredResponse = this.filterResponse(aiResponse, userMessage);

      return filteredResponse;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return `I'm sorry ${user?.name || 'there'}, I'm having trouble processing your request right now. Please try again later or contact support if the issue persists.`;
    }
  }

  static async getRelevantLMSData(userId, userMessage, userRole) {
    const message = userMessage.toLowerCase();
    let dataContext = '';

    try {
      // Check for course-related queries
      if (message.includes('course') || message.includes('enroll') || message.includes('learn') ||
          message.includes('aiml') || message.includes('ai') || message.includes('machine learning') ||
          message.includes('web') || message.includes('development') || message.includes('cybersecurity') ||
          message.includes('security') || message.includes('cloud') || message.includes('data science') ||
          message.includes('python') || message.includes('javascript') || message.includes('react') ||
          message.includes('devops') || message.includes('network') || message.includes('programming')) {
        if (userRole === 'student') {
          const enrolledCourses = await Course.findEnrolledByStudent(userId);
          const availableCourses = await Course.findPublished();

          // Filter courses based on specific topics mentioned
          let relevantCourses = availableCourses;
          if (message.includes('aiml') || message.includes('ai') || message.includes('machine learning')) {
            relevantCourses = availableCourses.filter(course =>
              course.title.toLowerCase().includes('ai') ||
              course.title.toLowerCase().includes('machine learning') ||
              course.title.toLowerCase().includes('data science') ||
              course.category.toLowerCase().includes('data science')
            );
          } else if (message.includes('web') || message.includes('development') || message.includes('javascript') || message.includes('react')) {
            relevantCourses = availableCourses.filter(course =>
              course.title.toLowerCase().includes('web') ||
              course.title.toLowerCase().includes('javascript') ||
              course.title.toLowerCase().includes('react') ||
              course.title.toLowerCase().includes('development') ||
              course.category.toLowerCase().includes('web') ||
              course.category.toLowerCase().includes('development')
            );
          } else if (message.includes('cybersecurity') || message.includes('security') || message.includes('network')) {
            relevantCourses = availableCourses.filter(course =>
              course.title.toLowerCase().includes('security') ||
              course.title.toLowerCase().includes('cyber') ||
              course.title.toLowerCase().includes('network') ||
              course.category.toLowerCase().includes('security')
            );
          } else if (message.includes('cloud') || message.includes('devops')) {
            relevantCourses = availableCourses.filter(course =>
              course.title.toLowerCase().includes('cloud') ||
              course.title.toLowerCase().includes('devops') ||
              course.category.toLowerCase().includes('cloud') ||
              course.category.toLowerCase().includes('devops')
            );
          } else if (message.includes('data science') || message.includes('python')) {
            relevantCourses = availableCourses.filter(course =>
              course.title.toLowerCase().includes('data science') ||
              course.title.toLowerCase().includes('python') ||
              course.category.toLowerCase().includes('data science')
            );
          }

          dataContext += `Enrolled Courses (${enrolledCourses.length}):\n`;
          enrolledCourses.slice(0, 5).forEach(course => {
            dataContext += `- ${course.title} (${course.category}) - Instructor: ${course.instructor?.name}\n`;
          });

          dataContext += `\nAvailable Courses (${availableCourses.length}):\n`;
          availableCourses.slice(0, 10).forEach(course => {
            dataContext += `- ${course.title} (${course.category}) - ${course.enrollment_count} students enrolled\n`;
          });

          if (relevantCourses.length > 0 && relevantCourses.length !== availableCourses.length) {
            dataContext += `\nRelevant Courses for your query (${relevantCourses.length}):\n`;
            relevantCourses.slice(0, 5).forEach(course => {
              dataContext += `- ${course.title} (${course.category}) - ${course.enrollment_count} students enrolled\n`;
            });
          }

          dataContext += `\nUI Navigation: Go to Dashboard > Course Catalog to browse and enroll in courses. Use My Courses & Overview to view enrolled courses.\n`;
        } else if (userRole === 'instructor') {
          const instructorCourses = await Course.findByInstructor(userId);
          dataContext += `Your Courses (${instructorCourses.length}):\n`;
          instructorCourses.forEach(course => {
            dataContext += `- ${course.title} (${course.category}) - ${course.enrollment_count} students enrolled\n`;
          });

          dataContext += `\nUI Navigation: Go to Dashboard > Course Manager to create and manage courses.\n`;
        }
      }

      // Check for category queries
      if (message.includes('categor') || message.includes('subject') || message.includes('topic')) {
        const allCourses = await Course.findPublished();
        const categories = [...new Set(allCourses.map(course => course.category))];
        dataContext += `\nAvailable Categories:\n${categories.join(', ')}\n`;
      }

      // Check for video/material queries
      if (message.includes('video') || message.includes('material') || message.includes('content') || message.includes('lesson')) {
        if (userRole === 'student') {
          const enrolledCourses = await Course.findEnrolledByStudent(userId);
          dataContext += `\nYour Course Content:\n`;
          for (const enrollment of enrolledCourses.slice(0, 3)) {
            const course = enrollment.course || enrollment;
            dataContext += `- ${course.title}: ${course.videos?.length || 0} videos, ${course.materials?.length || 0} materials\n`;
          }
        }
      }

      // Check for MCQ/quiz queries
      if (message.includes('quiz') || message.includes('mcq') || message.includes('test') || message.includes('question')) {
        if (userRole === 'student') {
          const enrolledCourses = await Course.findEnrolledByStudent(userId);
          dataContext += `\nAvailable Quizzes:\n`;
          for (const enrollment of enrolledCourses.slice(0, 3)) {
            const course = enrollment.course || enrollment;
            const mcqCount = await Mcq.countByCourse(course.id);
            dataContext += `- ${course.title}: ${mcqCount} quiz questions\n`;
          }
        } else if (userRole === 'instructor') {
          const instructorCourses = await Course.findByInstructor(userId);
          dataContext += `\nYour Course Quizzes:\n`;
          for (const course of instructorCourses) {
            const mcqCount = await Mcq.countByCourse(course.id);
            dataContext += `- ${course.title}: ${mcqCount} quiz questions\n`;
          }
        }
      }

      // Check for progress queries
      if (message.includes('progress') || message.includes('complete') || message.includes('finish')) {
        if (userRole === 'student') {
          const enrolledCourses = await Course.findEnrolledByStudent(userId);
          dataContext += `\nYour Progress:\n`;
          enrolledCourses.slice(0, 5).forEach(enrollment => {
            const course = enrollment.course || enrollment;
            const completedVideos = course.videos?.filter(v => v.studentProgress?.completed).length || 0;
            const totalVideos = course.videos?.length || 0;
            const progressPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
            dataContext += `- ${course.title}: ${progressPercent}% complete (${completedVideos}/${totalVideos} videos)\n`;
          });

          dataContext += `\nUI Navigation: Go to Dashboard > Progress Tracker to view detailed progress for each course.\n`;
        }
      }

      // Check for chat/messaging queries
      if (message.includes('chat') || message.includes('message') || message.includes('contact') || message.includes('talk') || message.includes('teacher') || message.includes('instructor')) {
        if (userRole === 'student') {
          dataContext += `\nCommunication Features:\n`;
          dataContext += `- Chat with instructors: Use the Chat feature in course pages to send direct messages\n`;
          dataContext += `- Group discussions: Participate in course discussion forums\n`;

          dataContext += `\nUI Navigation: Click on a course from My Courses & Overview, you can see bottom right > after seeing this you can chat with the instructor.\n`;
        } else if (userRole === 'instructor') {
          dataContext += `\nCommunication Features:\n`;
          dataContext += `- Chat with students: Respond to student messages in course chat\n`;
          dataContext += `- Manage discussions: Moderate course discussion forums\n`;

          dataContext += `\nUI Navigation: Go to Dashboard > gO Inside Side Course > you can see bottom right > after seeing this you can chat with the instructor.\n`;
        }
      }

      // If no specific data was gathered, provide general overview
      if (!dataContext) {
        const courseCount = await Course.count();
        const enrolledCount = userRole === 'student' ? (await Course.findEnrolledByStudent(userId)).length : 0;
        dataContext = `General LMS Overview:\n- Total courses available: ${courseCount}\n${userRole === 'student' ? `- Courses you're enrolled in: ${enrolledCount}\n` : ''}`;
      }

    } catch (error) {
      console.error('Error fetching LMS data for chatbot:', error);
      dataContext = 'Note: Some LMS data may not be available at the moment.';
    }

    return dataContext;
  }

  static filterResponse(aiResponse, userMessage) {
    // Check if the response is LMS-related
    const lmsKeywords = [
      'course', 'material', 'enrollment', 'progress', 'lms', 'learning',
      'video', 'quiz', 'assignment', 'grade', 'instructor', 'student',
      'dashboard', 'profile', 'navigation', 'feature', 'how to', 'help'
    ];

    const isLMSRelated = lmsKeywords.some(keyword =>
      aiResponse.toLowerCase().includes(keyword) ||
      userMessage.toLowerCase().includes(keyword)
    );

    if (!isLMSRelated && !aiResponse.includes("I'm sorry") && !aiResponse.includes("I can only help")) {
      return `I'm sorry, I can only assist with questions related to the Vortex LMS platform. I help with courses, materials, enrollment, progress tracking, and how to use LMS features. How can I help you with your learning journey?`;
    }

    return aiResponse;
  }

  static async saveMessage(userId, message, isAi = false) {
    return await ChatbotMessage.create({
      userId,
      message,
      isAi
    });
  }

  static async getConversationHistory(userId, limit = 50) {
    return await ChatbotMessage.findByUser(userId, limit);
  }
}
