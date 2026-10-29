// Avatar: rasm bo'lmasa yoki yuklanmasa — ismning bosh harfi
import { useState } from 'react';
import { getImageUrl } from '../utils/imageUrl';

export default function Avatar({ src, name, className }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img className={className} src={getImageUrl(src)} alt="" onError={() => setFailed(true)} />;
  }
  return <span className={`${className} ${className}--letter`}>{(name || 'Z').trim()[0]?.toUpperCase()}</span>;
}
