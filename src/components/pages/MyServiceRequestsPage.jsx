import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Plus, RefreshCw } from 'lucide-react';
import { safeGoBack } from '../utils/navigation.js';
import { getMyServiceRequests } from '../services/serviceRequests';
import '../../styles/myServiceRequests.css';

const STATUS_LABELS = {
  open: 'Ochiq',
  accepted: 'Usta tanlandi',
  on_way: 'Usta yo‘lda',
  arrived: 'Usta yetib keldi',
  in_progress: 'Jarayonda',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
  closed: 'Yopildi',
};

export default function MyServiceRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = useCallback(() => getMyServiceRequests({ limit: 100 }), []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchRequests();
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      console.error('So‘rovlar ro‘yxatini olishda xatolik:', loadError);
      setError('So‘rovlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  useEffect(() => {
    let isCurrent = true;
    fetchRequests()
      .then((response) => {
        if (isCurrent) {
          setRequests(Array.isArray(response.data) ? response.data : []);
          setError('');
        }
      })
      .catch((loadError) => {
        console.error('So‘rovlar ro‘yxatini olishda xatolik:', loadError);
        if (isCurrent) setError('So‘rovlarni yuklab bo‘lmadi. Qayta urinib ko‘ring.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [fetchRequests]);

  return (
    <main className="my-service-requests">
      <header className="my-service-requests__header">
        <button
          type="button"
          className="my-service-requests__back"
          onClick={() => safeGoBack(navigate)}
          aria-label="Orqaga"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <h1>Mening so‘rovlarim</h1>
          <p>Ustaga yuborgan xizmat so‘rovlaringiz</p>
        </div>
        <button
          type="button"
          className="my-service-requests__new"
          onClick={() => navigate('/request')}
        >
          <Plus size={18} /> Yangi so‘rov
        </button>
      </header>

      {loading ? (
        <p className="my-service-requests__message">Yuklanmoqda…</p>
      ) : error ? (
        <div className="my-service-requests__message" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadRequests}>
            <RefreshCw size={16} /> Qayta urinish
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="my-service-requests__empty">
          <ClipboardList size={36} />
          <h2>Hozircha so‘rov yo‘q</h2>
          <p>Yangi so‘rov yuboring, mos ustalar siz bilan bog‘lanadi.</p>
          <button type="button" onClick={() => navigate('/request')}>
            <Plus size={17} /> So‘rov yuborish
          </button>
        </div>
      ) : (
        <div className="my-service-requests__list">
          {requests.map((request) => (
            <Link
              key={request._id}
              to={`/requests/${request._id}`}
              className="my-service-requests__card"
            >
              <div className="my-service-requests__card-top">
                <strong>{request.category || 'Xizmat so‘rovi'}</strong>
                <span className={`my-service-requests__status my-service-requests__status--${request.status}`}>
                  {STATUS_LABELS[request.status] || request.status}
                </span>
              </div>
              <p>{request.description || 'Tavsif berilmagan'}</p>
              <div className="my-service-requests__card-bottom">
                <span>{request.location?.address || 'Manzil ko‘rsatilmagan'}</span>
                <span>{request.offersCount || 0} ta taklif</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
