import { useBusiness } from '../context/BusinessContext';

/**
 * <RoleGate roles={['admin', 'director']}>...</RoleGate>
 * Faqat shu rollardagi (yoki 'owner') foydalanuvchiga ichidagi kontentni
 * ko'rsatadi. Bu — FAQAT UI'ni yashirish uchun (qulaylik uchun);
 * haqiqiy xavfsizlik tekshiruvi HAR DOIM backend'da (businessAccess +
 * requireRole middleware) bo'lishi kerak — frontend RBAC osongina
 * chetlab o'tilishi mumkin.
 */
export default function RoleGate({ roles = [], children, fallback = null }) {
  const { myRole } = useBusiness();
  if (!myRole) return fallback;
  if (myRole === 'owner' || roles.includes(myRole)) {
    return children;
  }
  return fallback;
}