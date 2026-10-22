/* ============================================================
   CHAT CONTEXT
   Socket global — boshqa komponentlar ham ishlatadi
   ============================================================ */

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useAuth } from './AuthContext';
import { getConversations, getMessages } from '../services/chat';
import { getSocket } from '../lib/socket';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, session } = useAuth();

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  /* ============================================================
     SOCKET — GLOBAL (disconnect qilmaymiz!)
     ============================================================ */

  useEffect(() => {
    if (!session?.access_token) return undefined;

    /* ✅ Faqat olish — disconnect qilish yo'q */
    const s = getSocket();
    setSocket(s);

    return undefined;
    /* ❌ return () => socket.disconnect() — O'CHIRILDI */
  }, [session]);

  /* ============================================================
     CONVERSATIONS
     ============================================================ */

  useEffect(() => {
    if (user) fetchConversations();
     
  }, [user]);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Conversations xato:', err);
    }
  };

  const fetchMessages = async (withEmail) => {
    try {
      const res = await getMessages(withEmail);
      setMessages(res.data);
      setActiveChat(withEmail);
    } catch (err) {
      console.error('Messages xato:', err);
    }
  };

  const sendMessage = (to, message) => {
    const s = socket || getSocket();
    if (s?.connected) {
      s.emit('send_message', {
        from: user.email,
        to,
        message,
      });
    }
  };

  /* ============================================================
     RECEIVE MESSAGE
     ============================================================ */

  useEffect(() => {
    if (!socket) return undefined;

    const handler = (msg) => {
      if (activeChat === msg.from) {
        setMessages((prev) => [...prev, msg]);
      }
      fetchConversations();
    };

    socket.on('receive_message', handler);

    return () => {
      /* ✅ Faqat shu event'ni o'chiramiz — socket EMAS */
      socket.off('receive_message', handler);
    };
  }, [socket, activeChat]);

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeChat,
        messages,
        sendMessage,
        fetchMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);