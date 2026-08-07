// src/components/pages/BankDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Inbox, Bell, Activity, LogOut, Landmark, Clock, MessageCircle, Check, X, Loader2 } from 'lucide-react';
import api from '../services/api';
import '../../styles/bankDashboard.css';

const STATUS_LABELS = {
  new: { label: "Yangi", color: 'cyan' },
  in_progress: { label: 'Jarayonda', color: 'amber' },
  approved: { label: 'Tasdiqlandi', color: 'green' },
  rejected: { label: 'Rad etildi', color: 'red' },
};

export default function BankDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await api.get('/notifications');
        const bankApps = res.data.filter(
          (n) => n.itemType === 'bank_service' && n.type === 'order'
        );
        setApplications(bankApps);
      } catch (err) {
        console.error('Arizalarni yuklashda xatolik:', err);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const newCount = applications.filter((a) => (a.status || 'new') === 'new').length;
  const inProgressCount = applications.filter((a) => a.status === 'in_progress').length;
  const todayCount = applications.filter((a) => {
    const today = new Date().toDateString();
    return new Date(a.createdAt).toDateString() === today;
  }).length;

  const markAsRead = async (id) => {
    const app = applications.find((a) => a._id === id);
    if (app?.read) return;
    try {
      await api.put(`/notifications/${id}/read`);
      setApplications((prev) => prev.map((a) => (a._id === id ? { ...a, read: true } : a)));
    } catch (err) {
      console.error('Belgilashda xatolik:', err);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api.patch(`/notifications/${id}/status`, { status });
      setApplications((prev) => prev.map((a) => (a._id === id ? res.data : a)));
    } catch (err) {
      console.error('Status o\'zgartirishda xatolik:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openChat = (fromUserId) => {
    const targetId = fromUserId?._id || fromUserId;
    if (targetId) navigate(`/chat?userId=${targetId}`);
  };

  return (
    <div className="bd-page">
      <header className="bd-header">
        <div>
          <h1>Bank xodimi paneli</h1>
          <p className="bd-welcome">Xush kelibsiz, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <button className="bd-logout-btn" onClick={signOut}>
          <LogOut size={16} /> Chiqish
        </button>
      </header>

      <div className="bd-stats-row">
        <div className="bd-stat-card">
          <Inbox size={20} />
          <div>
            <span className="bd-stat-value">{newCount}</span>
            <span className="bd-stat-label">Yangi arizalar</span>
          </div>
        </div>
        <div className="bd-stat-card">
          <Activity size={20} />
          <div>
            <span className="bd-stat-value">{inProgressCount}</span>
            <span className="bd-stat-label">Jarayondagi arizalar</span>
          </div>
        </div>
        <div className="bd-stat-card">
          <Bell size={20} />
          <div>
            <span className="bd-stat-value">{todayCount}</span>
            <span className="bd-stat-label">Bugungi faollik</span>
          </div>
        </div>
      </div>

      <section className="bd-section">
        <h2>So'nggi arizalar</h2>
        {loading ? (
          <p className="bd-empty">Yuklanmoqda...</p>
        ) : applications.length === 0 ? (
          <div className="bd-empty">
            <Inbox size={40} />
            <p>Hozircha arizalar yo'q</p>
          </div>
        ) : (
          <div className="bd-applications-list">
            {applications.map((app) => {
              const status = app.status || 'new';
              const statusInfo = STATUS_LABELS[status];
              return (
                <div
                  key={app._id}
                  className={`bd-app-item ${!app.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(app._id)}
                >
                  <div className="bd-app-icon">
                    <Landmark size={18} />
                  </div>
                  <div className="bd-app-info">
                    <p className="bd-app-title">
                      <strong>{app.fromUserId?.fullName || 'Mijoz'}</strong> ariza berdi:{' '}
                      <span className="bd-app-service">{app.orderInfo?.title}</span>
                    </p>
                    <div className="bd-app-meta">
                      {app.orderInfo?.provider && <span>{app.orderInfo.provider}</span>}
                      {app.fromUserId?.email && <span>{app.fromUserId.email}</span>}
                      {app.fromUserId?.phone && <span>{app.fromUserId.phone}</span>}
                    </div>

                    <div className="bd-app-actions" onClick={(e) => e.stopPropagation()}>
                      <span className={`bd-status-badge bd-status-${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>

                      <button
                        type="button"
                        className="bd-chat-btn"
                        onClick={() => openChat(app.fromUserId)}
                      >
                        <MessageCircle size={14} /> Chatga o'tish
                      </button>

                      {status !== 'in_progress' && status !== 'approved' && status !== 'rejected' && (
                        <button
                          type="button"
                          className="bd-action-btn bd-action-progress"
                          disabled={updatingId === app._id}
                          onClick={() => updateStatus(app._id, 'in_progress')}
                        >
                          {updatingId === app._id ? <Loader2 size={13} className="bd-spin" /> : null}
                          Jarayonga olish
                        </button>
                      )}
                      {status === 'in_progress' && (
                        <>
                          <button
                            type="button"
                            className="bd-action-btn bd-action-approve"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'approved')}
                          >
                            <Check size={13} /> Tasdiqlash
                          </button>
                          <button
                            type="button"
                            className="bd-action-btn bd-action-reject"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'rejected')}
                          >
                            <X size={13} /> Rad etish
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="bd-app-time">
                    <Clock size={12} />
                    {new Date(app.createdAt).toLocaleDateString()}{' '}
                    {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!app.read && <span className="bd-app-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}