// src/components/pages/BankDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Inbox, Bell, Activity, LogOut, Landmark, Clock, MessageCircle, Check, X, Loader2, Phone } from 'lucide-react';
import { getBankApplications, updateBankApplicationStatus } from '../services/orders';
import '../../styles/bankDashboard.css';

import { T } from '../utils/T';
const STATUS_LABELS = {
  new: { label: T('Yangi'), color: 'cyan' },
  in_progress: { label: T('Jarayonda'), color: 'blue' },
  approved: { label: T('Tasdiqlandi'), color: 'solid' },
  rejected: { label: T('Rad etildi'), color: 'muted' },
};

export default function BankDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getBankApplications()
      .then((res) => setApplications(res.data?.applications || []))
      .catch((err) => {
        console.error('Arizalarni yuklashda xatolik:', err);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const newCount = applications.filter((a) => a.status === 'new').length;
  const inProgressCount = applications.filter((a) => a.status === 'in_progress').length;
  const todayCount = applications.filter((a) => {
    const today = new Date().toDateString();
    return new Date(a.createdAt).toDateString() === today;
  }).length;

  const visible = filter === 'all' ? applications : applications.filter((a) => a.status === filter);

  const updateStatus = async (id, status) => {
    let note;
    if (status === 'rejected') {
      note = window.prompt(T('Rad etish sababi (mijozga ko‘rinadi):'), '');
      if (note === null) return;
    }
    setUpdatingId(id);
    try {
      const res = await updateBankApplicationStatus(id, status, note);
      setApplications((prev) => prev.map((a) => (a._id === id ? res.data.application : a)));
    } catch (err) {
      alert(err.response?.data?.error || T('Holatni o‘zgartirib bo‘lmadi'));
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
          <h1>{T('Bank xodimi paneli')}</h1>
          <p className="bd-welcome">{T('Xush kelibsiz,')} {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <button className="bd-logout-btn" onClick={signOut}>
          <LogOut size={16} /> {T('Chiqish')}
        </button>
      </header>

      <div className="bd-stats-row">
        <div className="bd-stat-card">
          <Inbox size={20} />
          <div>
            <span className="bd-stat-value">{newCount}</span>
            <span className="bd-stat-label">{T('Yangi arizalar')}</span>
          </div>
        </div>
        <div className="bd-stat-card">
          <Activity size={20} />
          <div>
            <span className="bd-stat-value">{inProgressCount}</span>
            <span className="bd-stat-label">{T('Jarayondagi arizalar')}</span>
          </div>
        </div>
        <div className="bd-stat-card">
          <Bell size={20} />
          <div>
            <span className="bd-stat-value">{todayCount}</span>
            <span className="bd-stat-label">{T('Bugungi faollik')}</span>
          </div>
        </div>
      </div>

      <section className="bd-section">
        <div className="bd-section-head">
          <h2>{T('Arizalar')}</h2>
          <div className="bd-filters">
            {[['all', T('Hammasi')], ['new', T('Yangi')], ['in_progress', T('Jarayonda')], ['approved', T('Tasdiqlangan')], ['rejected', T('Rad etilgan')]].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`bd-filter ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <p className="bd-empty">{T('Yuklanmoqda...')}</p>
        ) : visible.length === 0 ? (
          <div className="bd-empty">
            <Inbox size={40} />
            <p>{T('Hozircha arizalar yo\'q')}</p>
          </div>
        ) : (
          <div className="bd-applications-list">
            {visible.map((app) => {
              const status = app.status || 'new';
              const statusInfo = STATUS_LABELS[status];
              const client = app.userId || {};
              return (
                <div key={app._id} className={`bd-app-item ${status === 'new' ? 'unread' : ''}`}>
                  <div className="bd-app-icon">
                    <Landmark size={18} />
                  </div>
                  <div className="bd-app-info">
                    <p className="bd-app-title">
                      <strong>{client.fullName || client.full_name || T('Mijoz')}</strong> ariza berdi:{' '}
                      <span className="bd-app-service">{app.serviceName}</span>
                    </p>
                    <div className="bd-app-meta">
                      {app.provider && <span>{app.provider}</span>}
                      {client.email && <span>{client.email}</span>}
                      {(app.phone || client.phone) && (
                        <a href={`tel:${app.phone || client.phone}`}><Phone size={12} /> {app.phone || client.phone}</a>
                      )}
                    </div>
                    {app.comment && <p className="bd-app-comment">“{app.comment}”</p>}
                    {app.staffNote && <p className="bd-app-note">{T('Izoh:')} {app.staffNote}</p>}
                    {app.handledBy && (
                      <p className="bd-app-handled">{T('Ko‘rib chiqdi:')} {app.handledBy.fullName || app.handledBy.full_name}</p>
                    )}

                    <div className="bd-app-actions" onClick={(e) => e.stopPropagation()}>
                      <span className={`bd-status-badge bd-status-${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>

                      <button
                        type="button"
                        className="bd-chat-btn"
                        onClick={() => openChat(client)}
                      >
                        <MessageCircle size={14} /> Chatga o'tish
                      </button>

                      {status === 'new' && (
                        <button
                          type="button"
                          className="bd-action-btn bd-action-progress"
                          disabled={updatingId === app._id}
                          onClick={() => updateStatus(app._id, 'in_progress')}
                        >
                          {updatingId === app._id ? <Loader2 size={13} className="bd-spin" /> : null}
                          {T('Jarayonga olish')}
                        </button>
                      )}
                      {status === 'new' && (
                        <button
                          type="button"
                          className="bd-action-btn bd-action-reject"
                          disabled={updatingId === app._id}
                          onClick={() => updateStatus(app._id, 'rejected')}
                        >
                          <X size={13} /> {T('Rad etish')}
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
                            <Check size={13} /> {T('Tasdiqlash')}
                          </button>
                          <button
                            type="button"
                            className="bd-action-btn bd-action-reject"
                            disabled={updatingId === app._id}
                            onClick={() => updateStatus(app._id, 'rejected')}
                          >
                            <X size={13} /> {T('Rad etish')}
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
                  {status === 'new' && <span className="bd-app-dot" />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}