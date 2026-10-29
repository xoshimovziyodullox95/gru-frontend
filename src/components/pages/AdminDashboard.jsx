import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Users, Package, Wrench, Shield, LayoutDashboard, Search, Trash2,
  Loader2, Crown, UserPlus, ShoppingBag, MapPin, Video, Wallet, RefreshCw,
} from 'lucide-react';
import {
  getOverview, getUsers, deleteUser, updateUserRole, getListings, deleteListing,
  getAdminRequests, getAuditLogs,
} from '../services/admin';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/formatPrice';
import { serviceLabel } from '../utils/i18nHelpers';
import { T } from '../utils/T';
import '../../styles/adminDashboard.css';

const ROLE_OPTIONS = [
  { value: 'user', label: T('Oddiy foydalanuvchi') },
  { value: 'business', label: T('Do\'konchi') },
  { value: 'company', label: T('Yetkazib beruvchi') },
  { value: 'bank_employee', label: T('Bank xodimi') },
  { value: 'admin', label: T('Administrator') },
];

const TABS = [
  { key: 'overview', icon: LayoutDashboard, label: T('Umumiy') },
  { key: 'users', icon: Users, label: T('Foydalanuvchilar') },
  { key: 'listings', icon: Package, label: T('E\'lonlar') },
  { key: 'requests', icon: Wrench, label: T('So\'rovlar') },
  { key: 'logs', icon: Shield, label: T('Jurnal') },
];

const LISTING_TYPES = [
  { key: 'equipment', label: T('Tovarlar') },
  { key: 'provider', label: T('Ustalar') },
  { key: 'location', label: T('Joylar') },
  { key: 'post', label: T('Videolar') },
];

const REQUEST_STATUS = {
  open: T('Ochiq'),
  accepted: T('Qabul qilindi'),
  on_way: T('Yo\'lda'),
  arrived: T('Yetib keldi'),
  in_progress: T('Bajarilmoqda'),
  completed: T('Bajarildi'),
  cancelled: T('Bekor qilindi'),
  expired: T('Muddati o\'tdi'),
};

const ORDER_STATUS = {
  yangi: T('Yangi'),
  qabul_qilindi: T('Qabul qilindi'),
  yetkazilmoqda: T('Yetkazilmoqda'),
  yetkazildi: T('Yetkazildi'),
  rad_etildi: T('Rad etildi'),
  bekor_qilindi: T('Bekor qilindi'),
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
const num = (n) => Number(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ');

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function Stat({ icon: Icon, value, label, tone }) {
  return (
    <div className={`ad-stat ${tone ? `ad-stat--${tone}` : ''}`}>
      <Icon size={18} />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function Breakdown({ title, data, labels }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  return (
    <section className="ad-card">
      <h3>{title}</h3>
      <div className="ad-pills">
        {entries.map(([k, n]) => (
          <span key={k} className="ad-pill">{labels[k] || k}<b>{n}</b></span>
        ))}
      </div>
    </section>
  );
}

function Empty({ loading, text }) {
  return <div className="ad-empty">{loading ? <Loader2 size={22} className="ad-spin" /> : text}</div>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [listingType, setListingType] = useState('equipment');
  const [requests, setRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const q = useDebounced(search);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'overview') setOverview((await getOverview()).data);
      else if (tab === 'users') setUsers((await getUsers({ q })).data || []);
      else if (tab === 'listings') setListings((await getListings(listingType, { q })).data || []);
      else if (tab === 'requests') setRequests((await getAdminRequests({ status: requestStatus || undefined })).data || []);
      else if (tab === 'logs') setLogs((await getAuditLogs()).data || []);
    } catch (err) {
      toast.error(err.response?.data?.error || T('Yuklab bo\'lmadi'));
    } finally {
      setLoading(false);
    }
  }, [tab, q, listingType, requestStatus]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- tab/filtr o'zgarganda ma'lumot yuklanadi
  useEffect(() => { load(); }, [load]);

  const changeTab = (key) => {
    setTab(key);
    setSearch('');
  };

  const handleRoleChange = async (u, role) => {
    setBusyId(u._id);
    try {
      await updateUserRole(u._id, role);
      setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, role } : x)));
      toast.success(T('Rol yangilandi'));
    } catch (err) {
      toast.error(err.response?.data?.error || T('Rolni yangilab bo\'lmadi'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(T('{{name}} — foydalanuvchi va uning e\'lonlari butunlay o\'chiriladi. Davom etasizmi?', { name: u.fullName || u.email }))) return;
    setBusyId(u._id);
    try {
      await deleteUser(u._id);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
      toast.success(T('O\'chirildi'));
    } catch (err) {
      toast.error(err.response?.data?.error || T('O\'chirib bo\'lmadi'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteListing = async (item) => {
    const title = item.title || item.name || T('E\'lon');
    if (!window.confirm(T('“{{title}}” o\'chirilsinmi? Buni qaytarib bo\'lmaydi.', { title }))) return;
    setBusyId(item._id);
    try {
      await deleteListing(listingType, item._id);
      setListings((prev) => prev.filter((x) => x._id !== item._id));
      toast.success(T('O\'chirildi'));
    } catch (err) {
      toast.error(err.response?.data?.error || T('O\'chirib bo\'lmadi'));
    } finally {
      setBusyId(null);
    }
  };

  const listingImage = (item) => {
    const src = item.images?.[0] || item.image || item.thumbnail;
    return src && !String(src).includes('default.jpg') ? getImageUrl(src) : '';
  };

  const listingMeta = (item) => {
    if (listingType === 'equipment') return formatPrice(item.price, item.currency);
    if (listingType === 'provider') return serviceLabel(item.service_category);
    if (listingType === 'location') return item.address;
    return item.description;
  };

  const listingLink = (item) => ({
    equipment: `/equipment/${item._id}`,
    provider: `/service-provider/${item._id}`,
    location: `/location/${item._id}`,
    post: `/posts/${item._id}`,
  }[listingType]);

  const o = overview;

  return (
    <div className="ad-page">
      <header className="ad-top">
        <button type="button" className="ad-back" onClick={() => navigate(-1)} aria-label={T('Orqaga')}>
          <ArrowLeft size={22} />
        </button>
        <h1>{T('Admin panel')}</h1>
        <button type="button" className="ad-back" onClick={load} aria-label={T('Yangilash')} disabled={loading}>
          <RefreshCw size={19} className={loading ? 'ad-spin' : ''} />
        </button>
      </header>

      <nav className="ad-tabs" role="tablist">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'is-on' : ''}
            onClick={() => changeTab(key)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <main className="ad-body">
        {tab === 'overview' && (
          !o ? <Empty loading={loading} text={T('Ma\'lumot yo\'q')} /> : (
            <>
              <div className="ad-stats">
                <Stat icon={Users} value={num(o.users)} label={T('Foydalanuvchilar')} />
                <Stat icon={UserPlus} value={`+${num(o.newUsers)}`} label={T('Shu hafta yangi')} tone="green" />
                <Stat icon={Crown} value={num(o.premium)} label={T('Premium')} tone="gold" />
                <Stat icon={Wallet} value={`${num(o.revenue)}`} label={T('Tushum, so\'m ({{n}} to\'lov)', { n: o.payments })} tone="gold" />
                <Stat icon={Wrench} value={num(o.providers)} label={T('Ustalar')} />
                <Stat icon={Wrench} value={num(o.requests)} label={T('Xizmat so\'rovlari')} />
                <Stat icon={Package} value={num(o.equipment)} label={T('Tovarlar')} />
                <Stat icon={ShoppingBag} value={num(o.orders)} label={T('Buyurtmalar')} />
                <Stat icon={MapPin} value={num(o.locations)} label={T('Joylar')} />
                <Stat icon={Video} value={num(o.posts)} label={T('Videolar')} />
              </div>
              <Breakdown title={T('Xizmat so\'rovlari holati')} data={o.requestsByStatus} labels={REQUEST_STATUS} />
              <Breakdown title={T('Buyurtmalar holati')} data={o.ordersByStatus} labels={ORDER_STATUS} />
              <Breakdown
                title={T('Rollar')}
                data={o.roles}
                labels={Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]))}
              />
            </>
          )
        )}

        {(tab === 'users' || tab === 'listings') && (
          <div className="ad-search">
            <Search size={17} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'users' ? T('Ism, email yoki telefon') : T('Nomi bo\'yicha qidirish')}
            />
          </div>
        )}

        {tab === 'users' && (
          users.length === 0 ? <Empty loading={loading} text={T('Hech narsa topilmadi')} /> : (
            <ul className="ad-list">
              {users.map((u) => (
                <li key={u._id} className="ad-item">
                  <span className="ad-avatar">
                    {u.avatar_url ? <img src={getImageUrl(u.avatar_url)} alt="" /> : (u.fullName || u.email || '?')[0].toUpperCase()}
                  </span>
                  <span className="ad-item__main">
                    <strong>
                      {u.fullName || '—'}
                      {u.isPremium && <Crown size={13} className="ad-crown" />}
                    </strong>
                    <small>{u.email || u.phone || ''}</small>
                    <small>{T('Qo\'shilgan:')} {fmtDate(u.createdAt)}</small>
                  </span>
                  <span className="ad-item__side">
                    <select
                      value={u.role}
                      disabled={busyId === u._id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      aria-label={T('Rol')}
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button type="button" className="ad-del" onClick={() => handleDeleteUser(u)} disabled={busyId === u._id} aria-label={T('O\'chirish')}>
                      <Trash2 size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )
        )}

        {tab === 'listings' && (
          <>
            <div className="ad-chips">
              {LISTING_TYPES.map((lt) => (
                <button key={lt.key} type="button" className={listingType === lt.key ? 'is-on' : ''} onClick={() => setListingType(lt.key)}>
                  {lt.label}
                </button>
              ))}
            </div>
            {listings.length === 0 ? <Empty loading={loading} text={T('Hech narsa topilmadi')} /> : (
              <ul className="ad-list">
                {listings.map((item) => {
                  const img = listingImage(item);
                  return (
                    <li key={item._id} className="ad-item">
                      <button type="button" className="ad-thumb" onClick={() => navigate(listingLink(item))}>
                        {img ? <img src={img} alt="" /> : <Package size={20} />}
                      </button>
                      <span className="ad-item__main" onClick={() => navigate(listingLink(item))} role="link" tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate(listingLink(item))}>
                        <strong>{item.title || item.name || '—'}</strong>
                        {listingMeta(item) && <small className="ad-clip">{listingMeta(item)}</small>}
                        <small>{item.userId?.fullName || item.userId?.email || ''} · {fmtDate(item.createdAt)}</small>
                      </span>
                      <button type="button" className="ad-del" onClick={() => handleDeleteListing(item)} disabled={busyId === item._id} aria-label={T('O\'chirish')}>
                        <Trash2 size={16} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            <div className="ad-chips">
              {[['', T('Hammasi')], ...Object.entries(REQUEST_STATUS)].map(([k, label]) => (
                <button key={k || 'all'} type="button" className={requestStatus === k ? 'is-on' : ''} onClick={() => setRequestStatus(k)}>
                  {label}
                </button>
              ))}
            </div>
            {requests.length === 0 ? <Empty loading={loading} text={T('Hech narsa topilmadi')} /> : (
              <ul className="ad-list">
                {requests.map((r) => {
                  const accepted = (r.offers || []).find((x) => x.status === 'accepted');
                  return (
                    <li key={r._id} className="ad-item ad-item--col">
                      <span className="ad-item__row">
                        <strong>{serviceLabel(r.category)}</strong>
                        <span className={`ad-status ad-status--${r.status}`}>{REQUEST_STATUS[r.status] || r.status}</span>
                      </span>
                      {r.description && <small className="ad-clip">{r.description}</small>}
                      <small>
                        {r.clientId?.fullName || r.clientId?.email || ''} · {fmtDate(r.createdAt)} · {T('{{n}} ta taklif', { n: (r.offers || []).length })}
                        {accepted ? ` · ${num(accepted.price)} ${T('so\'m')}` : ''}
                      </small>
                      {r.location?.address && <small className="ad-clip">{r.location.address}</small>}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {tab === 'logs' && (
          logs.length === 0 ? <Empty loading={loading} text={T('Hozircha yozuv yo\'q')} /> : (
            <ul className="ad-list">
              {logs.map((log) => (
                <li key={log._id} className="ad-item ad-item--col">
                  <span className="ad-item__row">
                    <strong>{log.action}</strong>
                    <small>{new Date(log.createdAt).toLocaleString('uz-UZ')}</small>
                  </span>
                  <small className="ad-clip">
                    {log.adminEmail} → {log.targetType}
                    {log.oldData?.title ? `: ${log.oldData.title}` : ''}
                    {log.oldData?.newRole ? `: ${log.oldData.role} → ${log.oldData.newRole}` : ''}
                    {log.oldData?.email ? `: ${log.oldData.email}` : ''}
                  </small>
                </li>
              ))}
            </ul>
          )
        )}
      </main>
    </div>
  );
}
