// Joriy foydalanuvchi shu e'longa sharh yoza oladimi (backend tekshiradi).
// reason: own (o'z e'loni) | already | not_bought | not_used | not_reviewable | guest
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getReviewEligibility } from '../services/reviews';

export function useReviewEligibility(type, id) {
  const { user } = useAuth();
  const [state, setState] = useState({ canReview: false, reason: user ? null : 'guest' });

  const refresh = useCallback(async () => {
    if (!user) return setState({ canReview: false, reason: 'guest' });
    try {
      const { data } = await getReviewEligibility(type, id);
      setState(data);
    } catch {
      setState({ canReview: false, reason: null });
    }
  }, [user, type, id]);

  useEffect(() => {
    const timer = setTimeout(refresh, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { ...state, isOwner: state.reason === 'own', refresh };
}

// Nega yoza olmasligini tushuntiruvchi matn (T bilan tarjima qilinadi)
export const ELIGIBILITY_HINTS = {
  not_bought: 'Sharhni tovarni sotib olgan xaridorlar yoza oladi',
  not_used: 'Sharhni xizmatdan foydalangan mijozlar yoza oladi',
  already: 'Siz bu e’longa sharh yozgansiz',
};
