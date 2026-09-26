import { useMemo, useState } from 'react';
import { Search, Lock, Unlock, Trash2 } from 'lucide-react';
import DataTable from '../../components/admin/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAsync } from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { getUsers, updateUser, deleteUser } from '../../services/api';
import { formatDate } from '../../utils/format';

const ROLES = { admin: 'Quản trị viên', staff: 'Nhân viên', visitor: 'Khách' };

export default function AdminUsers() {
  useDocumentTitle('Người dùng');
  const toast = useToast();
  const { user: me } = useAuth();
  const users = useAsync(getUsers, []);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return (users.data ?? []).filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users.data, search]);

  const patch = async (u, data, message) => {
    try {
      const updated = await updateUser(u.id, data);
      users.setData((list) => list.map((x) => (x.id === u.id ? updated : x)));
      toast.success(message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      await deleteUser(deleting.id);
      users.setData((list) => list.filter((u) => u.id !== deleting.id));
      toast.success(`Đã xóa tài khoản ${deleting.email}`);
      setDeleting(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'fullName', header: 'Người dùng', render: (u) => (
      <div className="cell-media">
        <span className="avatar-btn avatar-btn--static">{u.fullName.charAt(0)}</span>
        <div><strong>{u.fullName}</strong><small>{u.email}</small></div>
      </div>
    ) },
    { key: 'role', header: 'Vai trò', render: (u) => (
      <select
        value={u.role}
        disabled={u.id === me.id}
        onChange={(e) => patch(u, { role: e.target.value }, `Đã đổi vai trò của ${u.fullName}`)}
        aria-label={`Vai trò của ${u.fullName}`}
      >
        {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    ) },
    { key: 'status', header: 'Trạng thái', render: (u) => (
      <span className={`status status--${u.status === 'active' ? 'approved' : 'hidden'}`}>
        {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
      </span>
    ) },
    { key: 'createdAt', header: 'Ngày tạo', render: (u) => formatDate(u.createdAt) },
    { key: 'actions', header: '', className: 'cell-actions', render: (u) => u.id !== me.id && (
      <>
        <button
          className="icon-btn"
          onClick={() => patch(u, { status: u.status === 'active' ? 'locked' : 'active' }, u.status === 'active' ? `Đã khóa ${u.email}` : `Đã mở khóa ${u.email}`)}
          aria-label={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        >
          {u.status === 'active' ? <Lock size={17} /> : <Unlock size={17} />}
        </button>
        <button className="icon-btn icon-btn--danger" onClick={() => setDeleting(u)} aria-label={`Xóa ${u.email}`}><Trash2 size={17} /></button>
      </>
    ) },
  ];

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <div className="search-input search-input--sm">
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên hoặc email…" aria-label="Tìm người dùng" />
        </div>
      </div>
      <DataTable columns={columns} rows={rows} loading={users.loading} error={users.error} onRetry={users.reload} />
      <ConfirmModal
        open={Boolean(deleting)}
        title="Xóa tài khoản"
        message={`Xóa tài khoản ${deleting?.email}? Người dùng sẽ không đăng nhập được nữa.`}
        confirmLabel="Xóa tài khoản"
        loading={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
