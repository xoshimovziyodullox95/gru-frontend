// Eski /category/:level1 va /subcategory/... havolalari (150+ biznes yo'nalishi) endi
// marketplace tovar kategoriyalari ro'yxatiga olib boradi.
import { Navigate, useParams } from 'react-router-dom';
import { categoryPath } from '../utils/productCategories';

export default function CategoryRedirect() {
  const { level1 } = useParams();
  const id = decodeURIComponent(level1 || '');
  // Yangi kategoriya id'lari lotin harflari va chiziqchadan iborat; eski nomlar — umumiy ro'yxatga
  return <Navigate to={/^[a-z-]+$/.test(id) ? categoryPath(id) : '/marketplace/all'} replace />;
}
