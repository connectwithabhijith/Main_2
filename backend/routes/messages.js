const express = require('express');
const router = express.Router();
const {
  getOrCreateConversation,
  getConversations,
  sendMessage,
  getMessages,
  getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Conversation routes
router.post('/conversation', getOrCreateConversation);
router.get('/conversations', getConversations);

// Message routes
router.post('/', sendMessage);
router.get('/unread/count', getUnreadCount);
router.get('/:conversationId', getMessages);

module.exports = router;
