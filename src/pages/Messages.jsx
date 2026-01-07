import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { messagesApi } from '../lib/api';
import { 
  ArrowLeft, Send, Loader2, MessageCircle, 
  User, Package
} from 'lucide-react';
import { toast } from 'sonner';

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchConversations();
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (conversationId) {
      const conv = conversations.find(c => c._id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
        fetchMessages(conversationId);
        startPolling(conversationId);
      }
    } else {
      setSelectedConversation(null);
      setMessages([]);
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    }
  }, [conversationId, conversations]);

  const fetchConversations = async () => {
    try {
      const data = await messagesApi.getConversations();
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const data = await messagesApi.getMessages(convId);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const startPolling = (convId) => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }
    pollInterval.current = setInterval(() => {
      fetchMessages(convId);
    }, 5000);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId) return;

    setSending(true);
    try {
      await messagesApi.sendMessage(conversationId, newMessage.trim());
      setNewMessage('');
      fetchMessages(conversationId);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conv) => {
    return conv.participants?.find(p => p._id !== user?._id);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 86400000) { // Less than 24 hours
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container py-4 md:py-8">
        <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] rounded-xl border border-border overflow-hidden bg-card">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-border flex-shrink-0 ${conversationId ? 'hidden md:flex' : 'flex'} flex-col`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages
              </h2>
            </div>
            
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start by contacting a seller</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map(conv => {
                    const other = getOtherParticipant(conv);
                    return (
                      <Link
                        key={conv._id}
                        to={`/messages/${conv._id}`}
                        className={`block p-4 hover:bg-secondary/50 transition-colors ${
                          conversationId === conv._id ? 'bg-secondary/70' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {other?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">{other?.name}</p>
                              {conv.lastMessage?.createdAt && (
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {formatTime(conv.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.ad?.title || 'Ad'}
                            </p>
                            {conv.lastMessage?.content && (
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {conv.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
            {!conversationId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="md:hidden"
                    onClick={() => navigate('/messages')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  
                  {selectedConversation && (
                    <>
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getOtherParticipant(selectedConversation)?.name}
                        </p>
                        <Link 
                          to={`/ad/${selectedConversation.ad?._id}`}
                          className="text-sm text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                        >
                          <Package className="w-3 h-3" />
                          {selectedConversation.ad?.title}
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map(msg => {
                      const isOwn = msg.sender?._id === user?._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-secondary text-secondary-foreground rounded-bl-md'
                            }`}
                          >
                            <p className="break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={sending || !newMessage.trim()}>
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;
