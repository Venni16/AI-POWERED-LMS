import express from 'express';
import { ChatbotMessage } from '../models/ChatbotMessage.js';
import { AIChatbot } from '../utils/aiChatbot.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get chatbot conversation history for the authenticated user
router.get('/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, after } = req.query;

    let messages;
    if (after) {
      messages = await ChatbotMessage.findByUserAfter(userId, after);
    } else {
      messages = await ChatbotMessage.findByUser(userId, parseInt(limit));
    }

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching chatbot messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to the chatbot and get AI response
router.post('/messages', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    // Save user message
    const userMessage = await AIChatbot.saveMessage(userId, message.trim(), false);

    // Generate AI response
    const aiResponseText = await AIChatbot.generateResponse(userId, message.trim());

    // Save AI response
    const aiMessage = await AIChatbot.saveMessage(userId, aiResponseText, true);

    res.status(201).json({
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error('Error processing chatbot message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get chatbot message count for the authenticated user
router.get('/messages/count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await ChatbotMessage.countByUser(userId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching message count:', error);
    res.status(500).json({ error: 'Failed to fetch message count' });
  }
});

export default router;
