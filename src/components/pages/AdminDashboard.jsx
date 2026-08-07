import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, MapPin, Package, FileText, Shield,
  Search, Trash2, Crown, Loader2, LogOut
} from 'lucide-react';
import { getUsers, deleteUser, getStatistics, getAuditLogs, updateUserRole } from '../services/admin';
import { getLocations } from '../services/locations';
import { getEquipment } from '../services/equipment';
import '../../styles/adminDashboard.css';
import { formatPrice } from '../utils/formatPrice';

const ROLE_OPTIONS = [
  { value: 'user', label: 'Oddiy foydalanuvchi' },
  { value: 'business', label: "Do'konchi" },
  { value: 'company', label: 'Yetkazib beruvchi' },
  { value: 'bank_employee', label: 'Bank xodimi' },
  { value: 'admin', label: 'Administrator' },
];

export default function AdminDashboard() {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  // Barcha ma'lumotlarni yuklash
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [statsRes, usersRes, logsRes, locRes, eqRes] = await Promise.all([
          getStatistics(),
          getUsers(),
          getAuditLogs(),
          getLocations({ limit: 100 }),
          getEquipment({ limit: 100 }),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setLogs(logsRes.data);
        setLocations(locRes.data);
        setEquipmentList(eqRes.data);
      } catch (err) {
        console.error('Admin panel yuklash xatosi:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  // Ruxsat tekshiruvi
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;

  // Chiqish
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Rolni o'zgartirish
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Rol yangilashda xatolik:', err);
      alert('Rolni yangilab bo\'lmadi');
    } finally {
      setUpdatingId(null);
    }
  };

  // Foydalanuvchini o'chirish
  const handleDelete = async (userId, userEmail) => {
    if (!window.confirm(`${userEmail} — bu foydalanuvchini butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) return;
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error('O\'chirishda xatolik:', err);
      alert('Foydalanuvchini o\'chirib bo\'lmadi');
    }
  };

  // Qidiruv filtri
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.email?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q)
    );
  });

  // Rol bo'yicha son
  const getRoleCount = (roleKey) => {
    const found = stats?.roleBreakdown?.find((r) => r._id === roleKey);
    return found?.count || 0;
  };

  if (loading) {
    return (
      <div className="ad-loading">
        <Loader2 size={32} className="ad-spin" />
        <span>Yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="ad-page">
      <div className="ad-header">
        <h1><Crown size={24} /> G.R.U Admin</h1>
        <div className="ad-header-right">
          <p className="ad-welcome">Xush kelibsiz, {user.user_metadata?.full_name || user.email}</p>
          <button className="ad-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Chiqish</span>
          </button>
        </div>
      </div>

      {/* STATISTIKA KARTALARI (bosiladigan) */}
      <div className="ad-stats-grid">
        <div className="ad-stat-card">
          <Users size={20} />
          <div>
            <span className="ad-stat-value">{stats?.totalUsers ?? 0}</span>
            <span className="ad-stat-label">Jami foydalanuvchi</span>
          </div>
        </div>

        <button className="ad-stat-card ad-stat-clickable" onClick={() => setActiveTab('locations')}>
          <MapPin size={20} />
          <div>
            <span className="ad-stat-value">{stats?.totalLocations ?? 0}</span>
            <span className="ad-stat-label">Lokatsiyalar</span>
          </div>
        </button>

        <button className="ad-stat-card ad-stat-clickable" onClick={() => setActiveTab('equipment')}>
          <Package size={20} />
          <div>
            <span className="ad-stat-value">{stats?.totalEquipment ?? 0}</span>
            <span className="ad-stat-label">Tovarlar</span>
          </div>
        </button>

        <div className="ad-stat-card">
          <FileText size={20} />
          <div>
            <span className="ad-stat-value">{stats?.totalTurnkey ?? 0}</span>
            <span className="ad-stat-label">Turnkey so'rovlari</span>
          </div>
        </div>
      </div>

      {/* ROL TAQSIMOTI */}
      <div className="ad-role-breakdown">
        {ROLE_OPTIONS.map((r) => (
          <span key={r.value} className="ad-role-pill">
            {r.label}: <strong>{getRoleCount(r.value)}</strong>
          </span>
        ))}
      </div>

      {/* TABLAR */}
      <div className="ad-tabs">
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          <Users size={16} /> Foydalanuvchilar
        </button>
        <button className={activeTab === 'locations' ? 'active' : ''} onClick={() => setActiveTab('locations')}>
          <MapPin size={16} /> Lokatsiyalar
        </button>
        <button className={activeTab === 'equipment' ? 'active' : ''} onClick={() => setActiveTab('equipment')}>
          <Package size={16} /> Tovarlar
        </button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
          <Shield size={16} /> Audit jurnali
        </button>
      </div>

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="ad-section">
          <div className="ad-search-wrap">
            <Search size={16} />
            <input
              type="text"
              placeholder="Ism yoki email bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ad-users-table">
            <div className="ad-users-row ad-users-head">
              <span>Foydalanuvchi</span>
              <span>Email</span>
              <span>Rol</span>
              <span></span>
            </div>
            {filteredUsers.map((u) => (
              <div key={u._id} className="ad-users-row">
                <span className="ad-user-name">{u.fullName || '—'}</span>
                <span className="ad-user-email">{u.email}</span>
                <span>
                  <select
                    value={u.role}
                    disabled={updatingId === u._id}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                    className="ad-role-select"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </span>
                <button className="ad-delete-btn" onClick={() => handleDelete(u._id, u.email)}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {filteredUsers.length === 0 && <div className="ad-empty">Hech narsa topilmadi</div>}
          </div>
        </div>
      )}

      {/* LOCATIONS TAB */}
      {activeTab === 'locations' && (
        <div className="ad-section">
          <div className="ad-users-table">
            <div className="ad-users-row ad-users-head">
              <span>Nomi</span>
              <span>Manzil</span>
              <span>Yo'nalish</span>
              <span></span>
            </div>
            {locations.map((loc) => (
              <div key={loc._id} className="ad-users-row">
                <span className="ad-user-name">{loc.title}</span>
                <span className="ad-user-email">{loc.address}</span>
                <span>{loc.level1}</span>
                <button className="ad-delete-btn" onClick={() => alert('O\'chirish keyinroq qo\'shiladi')}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {locations.length === 0 && <div className="ad-empty">Hozircha lokatsiya yo'q</div>}
          </div>
        </div>
      )}

      {/* EQUIPMENT / TOVARLAR TAB */}
      {activeTab === 'equipment' && (
        <div className="ad-section">
          <div className="ad-users-table">
            <div className="ad-users-row ad-users-head">
              <span>Nomi</span>
              <span>Narxi</span>
              <span>Yo'nalish</span>
              <span></span>
            </div>
            {equipmentList.map((eq) => (
              <div key={eq._id} className="ad-users-row">
                <span className="ad-user-name">{eq.title}</span>
             
<span className="ad-user-email">{formatPrice(eq.price, eq.currency)}</span>
                <span>{eq.level1}</span>
                <button className="ad-delete-btn" onClick={() => alert('O\'chirish keyinroq qo\'shiladi')}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {equipmentList.length === 0 && <div className="ad-empty">Hozircha tovar yo'q</div>}
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="ad-section">
          <div className="ad-logs-list">
            {logs.length === 0 ? (
              <div className="ad-empty">Hozircha yozuv yo'q</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="ad-log-item">
                  <span className="ad-log-action">{log.action}</span>
                  <span className="ad-log-detail">
                    {log.adminEmail} → {log.targetType} ({log.targetId})
                  </span>
                  <span className="ad-log-time">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}