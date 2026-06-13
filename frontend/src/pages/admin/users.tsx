import React, { useEffect, useMemo, useState } from 'react';
import { Users, Loader2, Search, ShieldCheck, Ban, KeyRound, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  fetchAllUsers,
  updateUserRole,
  setUserActive,
  fetchAllPermissions,
  fetchUserPermissions,
  assignPermission,
  revokePermission,
  seedPermissions,
} from '@/lib/api';

const ROLES = ['candidate', 'recruiter', 'admin'];
const ROLE_LABELS: Record<string, string> = {
  candidate: 'Ứng viên',
  recruiter: 'Nhà tuyển dụng',
  admin: 'Admin',
};

export default function AdminUsersPage() {
  const { token, userId: myId } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [permUser, setPermUser] = useState<any | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      setUsers(await fetchAllUsers(token));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const name = u.jobUser?.fullName || u.company?.companyName || '';
      const matchSearch =
        !search ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (id: string, role: string) => {
    if (!token) return;
    setBusyId(id);
    try {
      await updateUserRole(id, role, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Đổi role thất bại');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    if (!token) return;
    setBusyId(id);
    try {
      await setUserActive(id, !isActive, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Quản lý người dùng
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tổng {users.length} người dùng. Tìm kiếm, đổi vai trò, khóa/mở và gán quyền.
        </p>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo email hoặc tên..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
        >
          <option value="">Tất cả vai trò</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Bảng */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-bold">Người dùng</th>
                <th className="text-left px-4 py-3 font-bold">Vai trò</th>
                <th className="text-left px-4 py-3 font-bold">Trạng thái</th>
                <th className="text-right px-4 py-3 font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground italic">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const name = u.jobUser?.fullName || u.company?.companyName || '—';
                  const isSelf = u.id === myId;
                  return (
                    <tr key={u.id} className="hover:bg-secondary/40">
                      <td className="px-4 py-3">
                        <span className="block font-bold text-foreground">{name}</span>
                        <span className="text-muted-foreground">{u.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          disabled={busyId === u.id || isSelf}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs disabled:opacity-50"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                            <Ban className="w-3.5 h-3.5" /> Đã khóa
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPermUser(u)}
                            className="px-2.5 py-1.5 border border-border rounded-lg font-semibold text-foreground hover:bg-secondary flex items-center gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" /> Quyền
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              disabled={busyId === u.id}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50 ${
                                u.isActive
                                  ? 'border border-destructive/40 text-destructive hover:bg-destructive/10'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              }`}
                            >
                              {u.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {permUser && (
        <PermissionsDialog
          user={permUser}
          token={token!}
          onClose={() => setPermUser(null)}
        />
      )}
    </main>
  );
}

function PermissionsDialog({
  user,
  token,
  onClose,
}: {
  user: any;
  token: string;
  onClose: () => void;
}) {
  const [allPerms, setAllPerms] = useState<any[]>([]);
  const [userPerms, setUserPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const [all, mine] = await Promise.all([
        fetchAllPermissions(token),
        fetchUserPermissions(user.id, token),
      ]);
      setAllPerms(all);
      setUserPerms(mine);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ownedIds = new Set(userPerms.map((up) => up.permissionId ?? up.permission?.permissionId));

  const toggle = async (permissionId: string, owned: boolean) => {
    setBusy(permissionId);
    try {
      if (owned) {
        await revokePermission(user.id, permissionId, token);
      } else {
        await assignPermission(user.id, permissionId, token);
      }
      await load();
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setBusy(null);
    }
  };

  const handleSeed = async () => {
    try {
      await seedPermissions(token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Seed quyền thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">Phân quyền</h2>
            <p className="text-[11px] text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
          ) : allPerms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground mb-3">Chưa có quyền nào trong hệ thống.</p>
              <button onClick={handleSeed} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold">
                Khởi tạo quyền mặc định
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {allPerms.map((p) => {
                const owned = ownedIds.has(p.permissionId);
                return (
                  <label
                    key={p.permissionId}
                    className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded-xl cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="block font-bold text-xs text-foreground">{p.name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.description}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={owned}
                      disabled={busy === p.permissionId}
                      onChange={() => toggle(p.permissionId, owned)}
                      className="w-4 h-4 accent-primary shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
