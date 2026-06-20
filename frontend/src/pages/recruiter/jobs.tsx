import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Users, Briefcase } from 'lucide-react';
import {
  fetchMyCompany, createJobPosting, updateJobPosting, deleteJobPosting, normalizeJob, type Job,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, recruiterNav } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillPicker } from '@/components/skill-picker';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination, paginate } from '@/components/ui/pagination';
import { formatSalary, topikLabel, jobTypeLabel, cn } from '@/lib/utils';

const PER_PAGE = 8;

const TOPIKS = ['NONE', 'TOPIK_I_LEVEL_2', 'TOPIK_II_LEVEL_3', 'TOPIK_II_LEVEL_4', 'TOPIK_II_LEVEL_5', 'TOPIK_II_LEVEL_6'];
const JOBTYPES = ['fulltime', 'parttime', 'remote', 'hybrid'];

const emptyForm = {
  title: '', description: '', location: '', salaryMin: '' as number | '', salaryMax: '' as number | '',
  jobType: 'fulltime', minTopikRequired: 'NONE', experienceYearsMin: 0, applicationDeadline: '', requiredSkills: [] as string[],
};

export function RecruiterJobsPage() {
  const { token } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [err, setErr] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    if (!token) return;
    return fetchMyCompany(token).then((c) => {
      if (c && (c.companyId || c.id)) {
        setHasCompany(true);
        setCompanyId(c.companyId ?? c.id);
        setJobs((c.jobPostings ?? c.job_postings ?? []).map(normalizeJob));
      }
    }).catch(() => {});
  };

  useEffect(() => { load()?.finally(() => setLoading(false)); /* eslint-disable-next-line */ }, [token]);

  const startNew = () => { setForm({ ...emptyForm }); setEditing('new'); setErr(''); };
  const startEdit = (j: Job) => {
    setForm({
      title: j.title, description: j.description, location: j.location,
      salaryMin: j.salaryMin ?? '', salaryMax: j.salaryMax ?? '', jobType: j.jobType ?? 'fulltime',
      minTopikRequired: j.minTopikRequired ?? 'NONE', experienceYearsMin: j.experienceYearsMin ?? 0,
      applicationDeadline: j.applicationDeadline?.slice(0, 10) ?? '', requiredSkills: j.requiredSkills ?? [],
    });
    setEditing(j.id); setErr('');
  };

  const submit = async () => {
    if (!token) return;
    const payload: any = {
      ...form,
      companyId,
      salaryMin: form.salaryMin === '' ? undefined : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? undefined : Number(form.salaryMax),
      experienceYearsMin: Number(form.experienceYearsMin) || 0,
      applicationDeadline: form.applicationDeadline || undefined,
    };
    try {
      if (editing === 'new') await createJobPosting(payload, token);
      else if (editing) await updateJobPosting(editing, payload, token);
      setEditing(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lưu tin thất bại');
    }
  };

  const remove = async (id: string) => {
    if (!token || !confirm('Xóa tin tuyển dụng này?')) return;
    await deleteJobPosting(id, token);
    load();
  };

  return (
    <DashboardShell
      nav={recruiterNav}
      kr="채용 관리"
      eyebrow="Nhà tuyển dụng"
      title="Tin tuyển dụng"
      description="Đăng và quản lý tin tuyển dụng của công ty."
      actions={hasCompany && !editing ? <Button onClick={startNew}><Plus className="h-4 w-4" /> Đăng tin mới</Button> : undefined}
    >
      {loading ? (
        <LoadingBlock />
      ) : !hasCompany ? (
        <EmptyState
          icon={<Briefcase />}
          title="Bạn chưa có hồ sơ công ty"
          description="Tạo hồ sơ công ty trước khi đăng tin tuyển dụng."
          action={<Link to="/recruiter/company" className={cn(buttonVariants())}>Tạo hồ sơ công ty</Link>}
        />
      ) : editing ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            <h3 className="font-display text-lg font-bold">{editing === 'new' ? 'Đăng tin mới' : 'Chỉnh sửa tin'}</h3>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Field label="Tiêu đề"><Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="VD: BrSE Java (Hà Nội)" /></Field>
            <Field label="Mô tả công việc"><Textarea value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} className="min-h-40" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Địa điểm"><Input value={form.location} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} /></Field>
              <Field label="Loại hình">
                <Select value={form.jobType} onChange={(e) => setForm((s) => ({ ...s, jobType: e.target.value }))}>
                  {JOBTYPES.map((t) => <option key={t} value={t}>{jobTypeLabel(t)}</option>)}
                </Select>
              </Field>
              <Field label="Lương tối thiểu (VND)"><Input type="number" value={form.salaryMin} onChange={(e) => setForm((s) => ({ ...s, salaryMin: e.target.value === '' ? '' : Number(e.target.value) }))} /></Field>
              <Field label="Lương tối đa (VND)"><Input type="number" value={form.salaryMax} onChange={(e) => setForm((s) => ({ ...s, salaryMax: e.target.value === '' ? '' : Number(e.target.value) }))} /></Field>
              <Field label="Yêu cầu TOPIK">
                <Select value={form.minTopikRequired} onChange={(e) => setForm((s) => ({ ...s, minTopikRequired: e.target.value }))}>
                  {TOPIKS.map((t) => <option key={t} value={t}>{topikLabel(t)}</option>)}
                </Select>
              </Field>
              <Field label="Kinh nghiệm tối thiểu (năm)"><Input type="number" min={0} value={form.experienceYearsMin} onChange={(e) => setForm((s) => ({ ...s, experienceYearsMin: Number(e.target.value) || 0 }))} /></Field>
              <Field label="Hạn nộp"><Input type="date" value={form.applicationDeadline} onChange={(e) => setForm((s) => ({ ...s, applicationDeadline: e.target.value }))} /></Field>
            </div>
            <Field label="Kỹ năng yêu cầu"><SkillPicker value={form.requiredSkills} onChange={(v) => setForm((s) => ({ ...s, requiredSkills: v }))} columns /></Field>
            <div className="flex gap-2">
              <Button onClick={submit} disabled={!form.title.trim()}>{editing === 'new' ? 'Đăng tin' : 'Lưu thay đổi'}</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Hủy</Button>
            </div>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="Chưa có tin tuyển dụng" description="Đăng tin đầu tiên để tiếp cận ứng viên." action={<Button onClick={startNew}><Plus className="h-4 w-4" /> Đăng tin mới</Button>} />
      ) : (
        <div className="flex flex-col gap-3">
          {paginate(jobs, Math.min(page, Math.max(1, Math.ceil(jobs.length / PER_PAGE))), PER_PAGE).map((j) => (
            <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{j.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="cobalt">{topikLabel(j.minTopikRequired)}</Badge>
                  <span className="signage-num">{formatSalary(j.salaryMin, j.salaryMax)}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {j.viewsCount ?? 0}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {j.applyCount ?? 0}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Link to={`/recruiter/jobs/${j.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                  <Users className="h-4 w-4" /> Ứng viên
                </Link>
                <Button variant="ghost" size="sm" onClick={() => startEdit(j)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(j.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          <Pagination page={Math.min(page, Math.max(1, Math.ceil(jobs.length / PER_PAGE)))} totalPages={Math.max(1, Math.ceil(jobs.length / PER_PAGE))} onChange={setPage} />
        </div>
      )}
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
