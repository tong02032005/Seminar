import { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';
import Skeleton from '../common/Skeleton';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getReviews, createReview } from '../../services/api';
import { formatDate } from '../../utils/format';

/** Danh sách đánh giá đã duyệt + form gửi đánh giá (cần đăng nhập) */
export default function ReviewSection({ animalId, animalName }) {
  const { user } = useAuth();
  const toast = useToast();
  const reviews = useAsync(() => getReviews({ animalId, status: 'approved' }), [animalId]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Chọn số sao trước khi gửi.');
    if (comment.trim().length < 10) return setError('Nhận xét cần ít nhất 10 ký tự.');
    setError('');
    setSending(true);
    try {
      await createReview({ animalId, user, rating, comment: comment.trim() });
      toast.success('Đã gửi đánh giá. Đánh giá sẽ hiển thị sau khi được duyệt.');
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const list = reviews.data ?? [];
  const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;

  return (
    <section className="reviews">
      <div className="reviews__head">
        <h2 className="section-title">Đánh giá của khách</h2>
        {list.length > 0 && (
          <div className="reviews__avg">
            <strong>{avg.toFixed(1)}</strong>
            <StarRating value={Math.round(avg)} />
            <span>({list.length})</span>
          </div>
        )}
      </div>

      <div className="reviews__layout">
        <div className="reviews__list">
          {reviews.loading && <Skeleton height={80} radius={12} />}
          {!reviews.loading && list.length === 0 && (
            <p className="muted">Chưa có đánh giá nào cho {animalName}. Hãy là người đầu tiên.</p>
          )}
          {list.map((r) => (
            <div key={r.id} className="review">
              <div className="review__head">
                <span className="avatar-btn avatar-btn--static">{r.userName.charAt(0)}</span>
                <div>
                  <strong>{r.userName}</strong>
                  <small>{formatDate(r.createdAt)}</small>
                </div>
                <StarRating value={r.rating} size={15} />
              </div>
              <p>{r.comment}</p>
            </div>
          ))}
        </div>

        {user ? (
          <form className="review-form" onSubmit={submit}>
            <h3>Viết đánh giá</h3>
            <StarRating value={rating} onChange={setRating} size={26} />
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Chia sẻ trải nghiệm của bạn khi xem ${animalName}…`}
              aria-label="Nội dung đánh giá"
            />
            {error && <small className="field__error">{error}</small>}
            <button className="btn btn--primary" disabled={sending}>{sending ? 'Đang gửi…' : 'Gửi đánh giá'}</button>
          </form>
        ) : (
          <div className="review-form review-form--guest">
            <p>Đăng nhập để gửi đánh giá về {animalName}.</p>
            <Link to="/login" state={{ from: `/animals/${animalId}` }} className="btn btn--primary">Đăng nhập</Link>
          </div>
        )}
      </div>
    </section>
  );
}
