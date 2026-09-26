import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageSquareText, LogOut, LayoutDashboard } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import FormField from '../components/common/FormField';
import StarRating from '../components/common/StarRating';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { useAsync } from '../hooks/useAsync';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getReviews, updateProfile } from '../services/api';
import { formatDate } from '../utils/format';

const ROLE_LABEL = { admin: 'Quản trị viên', staff: 'Nhân viên', visitor: 'Khách tham quan' };
const REVIEW_STATUS = { approved: 'Đã duyệt', pending: 'Chờ duyệt', hidden: 'Đã ẩn' };

export default function Profile() {
  useDocumentTitle('Tài khoản');
  const { user, updateUser, logout, isAdmin } = useAuth();
  const { favoriteIds } = useFavorites();
  const toast = useToast();
  const navigate = useNavigate();
  const reviews = useAsync(() => getReviews({ userId: user.id }), [user.id]);

  const [fullName, setFullName] = useState(user.fullName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return setError('Họ tên cần ít nhất 2 ký tự.');
    setError('');
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName: fullName.trim() });
      updateUser(updated);
      toast.success('Đã lưu thông tin cá nhân');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Đã đăng xuất');
    navigate('/');
  };

  return (
    <>
      <PageHeader title="Tài khoản của bạn" />
      <section className="section section--flush-top">
        <div className="container profile-layout">
          <aside className="profile-card">
            <span className="profile-card__avatar">{user.fullName.charAt(0)}</span>
            <h2>{user.fullName}</h2>
            <p className="muted">{user.email}</p>
            <span className="badge badge--neutral">{ROLE_LABEL[user.role] ?? user.role}</span>
            <dl className="profile-card__stats">
              <div><dt><Heart size={16} /> Yêu thích</dt><dd>{favoriteIds.length}</dd></div>
              <div><dt><MessageSquareText size={16} /> Đánh giá</dt><dd>{reviews.data?.length ?? '–'}</dd></div>
            </dl>
            <p className="muted small">Tham gia từ {formatDate(user.createdAt)}</p>
            {isAdmin && <Link to="/admin" className="btn btn--outline btn--block"><LayoutDashboard size={18} /> Trang quản trị</Link>}
            <button className="btn btn--ghost btn--block" onClick={handleLogout}><LogOut size={18} /> Đăng xuất</button>
          </aside>

          <div className="stack-lg">
            <form className="panel" onSubmit={save}>
              <h3>Thông tin cá nhân</h3>
              <div className="form-grid">
                <FormField label="Họ và tên" id="p-name" value={fullName} onChange={(e) => setFullName(e.target.value)} error={error} />
                <FormField label="Email" id="p-email" value={user.email} disabled hint="Email dùng để đăng nhập, không thể thay đổi." />
              </div>
              <button className="btn btn--primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
            </form>

            <div className="panel">
              <h3>Đánh giá đã gửi</h3>
              {reviews.data?.length === 0 && <p className="muted">Bạn chưa gửi đánh giá nào. Mở trang một loài động vật để viết đánh giá.</p>}
              <ul className="my-reviews">
                {reviews.data?.map((r) => (
                  <li key={r.id}>
                    <div>
                      <Link to={`/animals/${r.animalId}`}><strong>{r.animalName}</strong></Link>
                      <StarRating value={r.rating} size={14} />
                    </div>
                    <p>{r.comment}</p>
                    <small className={`status status--${r.status}`}>{REVIEW_STATUS[r.status]}</small>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
