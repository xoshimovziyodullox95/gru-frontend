import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getConversations, getMessages } from '../services/chat';
import {  getSocket } from '../lib/socket';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, session } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (session?.access_token) {
      initSocket().then(s => setSocket(s));
    }
    return () => {
      const s = getSocket();
      if (s) s.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (withEmail) => {
    try {
      const res = await getMessages(withEmail);
      setMessages(res.data);
      setActiveChat(withEmail);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = (to, message) => {
    if (socket) {
      socket.emit('send_message', { from: user.email, to, message });
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('receive_message', (msg) => {
      if (activeChat === msg.from) {
        setMessages(prev => [...prev, msg]);
      }
      fetchConversations();
    });
    return () => socket.off('receive_message');
  }, [socket, activeChat]);

  return (
    <ChatContext.Provider value={{ conversations, activeChat, messages, sendMessage, fetchMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);