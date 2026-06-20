import { useEffect, useMemo, useState } from 'react';
import { Search, Lock, Unlock, ShieldCheck, ChevronDown } from 'lucide-react';
import {
  fetchAllUsers, updateUserRole, setUserActive, fetchAllPermissions,
  fetchUserPermissions, assignPermission, revokePermission, seedPermissions,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, adminNav } from '@/components/layout/dashboard-shell';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { Pagination, paginate } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

const ROLES = ['candidate', 'recruiter', 'admin'];
const PER_PAGE = 6;

export function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [perms, setPerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const reload = () => token && fetchAllUsers(token).then(setUsers).catch(() => {});

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([fetchAllUsers(token), fetchAllPermissions(token)]).then(([u, p]) => {
      if (u.status === 'fulfilled') setUsers(u.value);
      if (p.status === 'fulfilled') setPerms(p.value);
      setLoading(false);
    });
  }, [token]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? users.filter((u) => (u.email ?? '').toLowerCase().includes(t)) : users;
  }, [users, q]);

  useEffect(() => setPage(1), [q]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = paginate(filtered, safePage, PER_PAGE);

  const onSeed = async () => {
    if (!token) return;
    await seedPermissions(token).catch(() => {});
    fetchAllPermissions(token).then(setPerms).catch(() => {});
  };

  return (
    <DashboardShell
      nav={adminNav}
      kr="사용자 관리"
      eyebrow="Quản trị"
      title="Người dùng"
      description="Quản lý vai trò, trạng thái và quyền của người dùng."
      actions={perms.length === 0 ? <Button variant="outline" onClick={onSeed}>Tạo quyền mặc định</Button> : undefined}
    >
      <div className="relative mb-5 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo email…" className="pl-10" />
      </div>

      {loading ? (
        <LoadingBlock />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground"><span className="signage-num font-medium text-foreground">{filtered.length}</span> người dùng</p>
          <div className="flex flex-col gap-2">
            {paged.map((u, i) => (
              <UserRow key={u.id} ordinal={(safePage - 1) * PER_PAGE + i + 1} user={u} perms={perms} token={token!} onChanged={reload} />
            ))}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </DashboardShell>
  );
}

function UserRow({ ordinal, user, perms, token, onChanged }: { ordinal: number; user: any; perms: any[]; token: string; onChanged: () => void }) {
  const active = user.isActive ?? true;
  const [open, setOpen] = useState(false);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loadedPerms, setLoadedPerms] = useState(false);

  const toggleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && !loadedPerms) {
      try {
        const up = await fetchUserPermissions(user.id, token);
        setAssigned(new Set(up.map((p: any) => p.permissionId ?? p.id ?? p.permission?.permissionId)));
      } catch { /* ignore */ }
      setLoadedPerms(true);
    }
  };

  const togglePerm = async (permId: string) => {
    const has = assigned.has(permId);
    setAssigned((s) => { const n = new Set(s); has ? n.delete(permId) : n.add(permId); return n; });
    try {
      if (has) await revokePermission(user.id, permId, token);
      else await assignPermission(user.id, permId, token);
    } catch { /* revert on error */ }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="signage-num w-7 shrink-0 text-center text-sm font-semibold text-muted-foreground">{ordinal}</span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 truncate font-medium">
              {user.email}
              {!active && <Badge variant="outline">Đã khóa</Badge>}
            </p>
            <p className="text-xs text-muted-foreground">{user.jobUser?.fullName ?? user.company?.companyName ?? ''}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value, token).then(onChanged)} className="h-9 w-auto">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={() => setUserActive(user.id, !active, token).then(onChanged)} className={active ? 'text-destructive' : ''}>
            {active ? <><Lock className="h-4 w-4" /> Khóa</> : <><Unlock className="h-4 w-4" /> Mở</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleOpen}>
            <ShieldCheck className="h-4 w-4" /> Quyền <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border p-4">
          {perms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có quyền nào trong hệ thống. Bấm "Tạo quyền mặc định".</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {perms.map((p) => {
                const pid = p.permissionId ?? p.id;
                const has = assigned.has(pid);
                return (
                  <button
                    key={pid}
                    onClick={() => togglePerm(pid)}
                    className={cn('rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors', has ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-foreground/30')}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
