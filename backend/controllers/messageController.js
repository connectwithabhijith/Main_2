const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Ad = require('../models/Ad');

// @desc    Get or create conversation
// @route   POST /api/messages/conversation
// @access  Private
const getOrCreateConversation = async (req, res) => {
  try {
    const { adId, sellerId } = req.body;
    const buyerId = req.user._id;

    // Validate that buyer is not the seller
    if (buyerId.toString() === sellerId) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      ad: adId,
      participants: { $all: [buyerId, sellerId] }
    }).populate('participants', 'name email avatar')
      .populate('ad', 'title images');

    if (!conversation) {
      // Verify ad exists
      const ad = await Ad.findById(adId);
      if (!ad) {
        return res.status(404).json({ message: 'Ad not found' });
      }

      // Create new conversation
      conversation = await Conversation.create({
        participants: [buyerId, sellerId],
        ad: adId
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar')
        .populate('ad', 'title images');
    }

    res.json(conversation);
  } catch (error) {
    console.error('Get/create conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all conversations for user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
      .populate('participants', 'name email avatar')
      .populate('ad', 'title images status')
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to send message in this conversation' });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim()
    });

    // Update conversation's last message
    conversation.lastMessage = {
      content: content.trim().substring(0, 100),
      sender: req.user._id,
      createdAt: new Date()
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get messages for conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this conversation' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { 
        conversation: conversationId, 
        sender: { $ne: req.user._id },
        read: false 
      },
      { read: true }
    );

    const total = await Message.countDocuments({ conversation: conversationId });

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    // Find all conversations where user is participant
    const conversations = await Conversation.find({
      participants: req.user._id
    });

    const conversationIds = conversations.map(c => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user._id },
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  sendMessage,
  getMessages,
  getUnreadCount
};
