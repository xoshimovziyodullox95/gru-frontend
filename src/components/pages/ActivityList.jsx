// src/components/pages/ActivityList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { getPosts } from '../services/videos';
import toast from 'react-hot-toast';

export default function ActivityList({ userId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getPosts();
        const posts = res.data || [];
        const userIdStr = userId.toString();

        const allActivities = [];
        posts.forEach(post => {
          // Like'lar
          if (post.likes?.some(id => id.toString() === userIdStr)) {
            allActivities.push({
              id: `like-${post._id}`,
              type: 'like',
              postId: post._id,
              postTitle: post.title || 'Video',
              videoUrl: post.videoUrl,
              createdAt: post.createdAt,
            });
          }
          // Comment'lar
          post.comments?.forEach(c => {
            if (c.userId?.toString() === userIdStr) {
              allActivities.push({
                id: `comment-${post._id}-${c._id}`,
                type: 'comment',
                postId: post._id,
                postTitle: post.title || 'Video',
                videoUrl: post.videoUrl,
                commentText: c.text,
                createdAt: c.createdAt,
              });
            }
          });
        });

        allActivities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(allActivities.slice(0, 50));
      } catch (err) {
        console.error('Faoliyatlarni yuklashda xatolik:', err);
        toast.error('Faoliyatlarni yuklashda xatolik');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  if (loading) return <div className="activity-loading">Yuklanmoqda...</div>;
  if (activities.length === 0) return <div className="activity-empty">Hozircha hech qanday faoliyat yo‘q</div>;

  return (
    <div className="activity-list">
      {activities.map(act => (
        <div
          key={act.id}
          className="activity-item"
          onClick={() => navigate(`/posts/${act.postId}`)}
        >
          <div className="activity-icon">
            {act.type === 'like' ? (
              <Heart size={16} color="#ff3040" fill="#ff3040" />
            ) : (
              <MessageCircle size={16} color="#0095f6" />
            )}
          </div>
          <div className="activity-content">
            <span className="activity-type">
              {act.type === 'like' ? 'Like bosdi' : 'Comment yozdi'}
            </span>
            <span className="activity-title">{act.postTitle}</span>
            {act.type === 'comment' && (
              <span className="activity-text">"{act.commentText}"</span>
            )}
            <span className="activity-date">
              {new Date(act.createdAt).toLocaleDateString('uz-UZ', {
                day: '2-digit', month: '2-digit', year: 'numeric'
              })}
            </span>
          </div>
          <ChevronRight size={16} className="activity-arrow" />
        </div>
      ))}
    </div>
  );
}