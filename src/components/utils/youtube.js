// utils/youtube.js
export const getYoutubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/shorts\/)([^&?/]+)/,
    /(?:youtu\.be\/)([^&?/]+)/,
    /(?:youtube\.com\/watch\?v=)([^&?/]+)/,
    /(?:youtube\.com\/embed\/)([^&?/]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const getYoutubeThumb = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
};

export const getYoutubeEmbedUrl = (videoId, autoplay = true) => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&showinfo=0`;
};