import { useAuth } from '../context/AuthContext';
import { addToCart } from '../services/cart';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
export default function ProductCard({ product }) {
  const { session } = useAuth();

  const handleAddToCart = async () => {
    if (!session) {
      alert('Iltimos, avval tizimga kiring');
      return;
    }
    await addToCart('equipment', product._id);
    alert('Savatga qo‘shildi');
  };

  return (
    <div className="glass-card overflow-hidden group">
      <img src={product.images?.[0] || '/placeholder.png'} alt={product.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white">{product.title}</h3>
        <p className="text-cyan-400 font-bold mt-1">{formatPrice(product.price, product.currency)}</p>
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full bg-cyan-500/20 border border-cyan-400/50 rounded-lg py-2 flex items-center justify-center gap-2 hover:bg-cyan-500/30 transition"
        >
          <ShoppingCart size={18} /> Savatga
        </button>
      </div>
    </div>
  );
}