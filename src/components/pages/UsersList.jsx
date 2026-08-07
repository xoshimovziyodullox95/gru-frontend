// src/pages/UsersList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, searchUsers } from '../services/users';
import { Search, MessageCircle } from 'lucide-react';
import '../../styles/usersList.css';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (query = '') => {
    setLoading(true);
    try {
      const res = query ? await searchUsers(query) : await getAllUsers();
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    loadUsers(val);
  };

  const startChat = (userId, fullName, avatar) => {
    navigate(`/chat?userId=${userId}&name=${encodeURIComponent(fullName)}&avatar=${encodeURIComponent(avatar)}`);
  };

  if (loading) return <div className="users-loading">Yuklanmoqda...</div>;

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>👥 Foydalanuvchilar</h2>
        <div className="users-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Ism yoki email bo‘yicha qidirish..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      <div className="users-grid">
        {users.length === 0 ? (
          <div className="users-empty">Foydalanuvchilar topilmadi</div>
        ) : (
          users.map(user => (
            <div key={user._id} className="user-card">
              <img src={user.avatar_url || '/images/placeholder.jpg'} alt={user.fullName} />
              <div className="user-info">
                <h4>{user.fullName || 'Ism yo‘q'}</h4>
                <span>{user.email}</span>
              </div>
              <button className="chat-user-btn" onClick={() => startChat(user._id, user.fullName, user.avatar_url)}>
                <MessageCircle size={18} /> Xabar yozish
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}