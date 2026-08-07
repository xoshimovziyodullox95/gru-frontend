import { MapPin } from 'lucide-react';

export default function LocationCard({ location }) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-xl font-semibold text-white">{location.title}</h3>
      <p className="text-gray-300 flex items-center gap-1 mt-1"><MapPin size={14} /> {location.address}</p>
      <p className="text-cyan-400 font-bold mt-2">${location.price_per_month}/oy</p>
      <p className="text-sm text-gray-400">{location.sqm} kv.m | 🚶 {location.foot_traffic}</p>
    </div>
  );
}