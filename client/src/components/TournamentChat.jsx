import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import expressApi from '../api/expressApi';

const TournamentChat = ({ tournamentId, status, organizerId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Fetch initial messages
  useEffect(() => {
    if (isOpen && loading) {
      const fetchMessages = async () => {
        try {
          const res = await expressApi.get(`/api/chat/${tournamentId}`);
          if (res.data.success) {
            setMessages(res.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch chat history', error);
        } finally {
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [isOpen, tournamentId, loading]);

  // Handle socket events
  useEffect(() => {
    if (!socket || !tournamentId) return;

    socket.emit('join_tournament', tournamentId);

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_tournament', tournamentId);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, tournamentId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !socket) return;

    socket.emit('send_message', {
      tournamentId,
      senderId: user.id,
      senderName: user.name || user.username,
      senderRole: user.role,
      senderAvatar: user.avatar,
      text: newMessage.trim()
    });

    setNewMessage('');
  };

  // If tournament is completed, we hide the chat entirely as per logic
  if (status === 'completed') {
    return null; 
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary-hover text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl shadow-primary/20 transition-transform hover:scale-105 z-40"
        >
          <i className="fa-solid fa-message text-xl"></i>
        </button>
      )}

      {/* Slide-out Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[350px] bg-white border-l border-border shadow-2xl transition-transform duration-300 z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-border p-4 flex justify-between items-center">
          <h3 className="font-bold text-text uppercase tracking-wider flex items-center gap-2">
            <i className="fa-solid fa-comments text-primary"></i> Lobby Chat
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-text-secondary hover:text-text flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center text-text-secondary">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-primary"></i>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary/50 p-6 text-center">
              <i className="fa-regular fa-message text-4xl mb-3"></i>
              <p className="text-sm font-medium mt-2">No messages yet. Say hello!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const senderId = msg.sender?._id || msg.sender?.id || msg.sender;
              const senderName = msg.sender?.name || msg.sender?.username || 'Unknown';
              const isMe = user && String(senderId) === String(user.id);
              const isOrganizer = String(senderId) === String(organizerId);

              return (
                <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-text-secondary">{senderName}</span>
                      {isOrganizer && (
                        <span className="text-[0.55rem] uppercase tracking-widest bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-black">
                          Organizer
                        </span>
                      )}
                    </div>
                  )}
                  <div 
                    className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-[0.9rem] ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : isOrganizer 
                          ? 'bg-yellow-500/10 border border-yellow-500/20 text-text rounded-tl-none'
                          : 'bg-surface border border-border text-text rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[0.65rem] text-text-secondary/50 mt-1 font-medium">
                    {msg.createdAt ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(new Date(msg.createdAt)) : 'Just now'}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-50 border-t border-border">
          {user ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-white border border-border rounded-full px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
                maxLength={500}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <i className="fa-solid fa-paper-plane text-xs relative -left-0.5"></i>
              </button>
            </form>
          ) : (
            <div className="text-center py-2 text-sm text-text-secondary font-medium bg-black/20 rounded-[8px] border border-border">
              Please log in to participate in the chat.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TournamentChat;
