// Joriy foydalanuvchining Mongo _id si.
// useAuth().user — Supabase foydalanuvchisi (user.id = UUID), e'lon/profil egalari esa
// Mongo _id bilan keladi, shuning uchun "bu meniki" tekshiruvi uchun shu id kerak.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/user';

let cached = { uuid: null, promise: null };

function loadMongoId(uuid) {
  if (cached.uuid !== uuid || !cached.promise) {
    cached = {
      uuid,
      promise: getUserProfile()
        .then((res) => (res.data?._id ? String(res.data._id) : null))
        .catch(() => {
          cached = { uuid: null, promise: null }; // keyingi safar qayta urinib ko'radi
          return null;
        }),
    };
  }
  return cached.promise;
}

export function useMyMongoId() {
  const { user } = useAuth();
  const [state, setState] = useState({ uuid: null, id: null });

  useEffect(() => {
    if (!user?.id) return undefined;
    let alive = true;
    loadMongoId(user.id).then((id) => {
      if (alive) setState({ uuid: user.id, id });
    });
    return () => { alive = false; };
  }, [user?.id]);

  // Boshqa akkauntga o'tilganda eski id qaytmasin
  return user?.id && state.uuid === user.id ? state.id : null;
}

export const sameId = (a, b) => Boolean(a && b && String(a) === String(b));
