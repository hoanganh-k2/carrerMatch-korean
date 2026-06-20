import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Sparkles, CalendarPlus } from 'lucide-react';
import {
  fetchJobById, fetchApplicationsByJob, fetchMatchCandidates, updateApplicationStatus, createInterview, type Job,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, recruiterNav } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchBadge } from '@/components/ui/match-badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { appStatus, cn } from '@/lib/utils';

const STATUSES = ['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected'];

export function RecruiterJobDetailPage() {
  const { jobId = '' } = useParams();
  const { token } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [tab, setTab] = useState<'apps' | 'matches'>('apps');
  const [loading, setLoading] = useState(true);

  const loadApps = () => {
    if (token) fetchApplicationsByJob(jobId, token).then(setApps).catch(() => {});
  };

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      fetchJobById(jobId),
      fetchApplicationsByJob(jobId, token),
      fetchMatchCandidates(jobId, token),
    ]).then(([j, a, m]) => {
      if (j.status === 'fulfilled') setJob(j.value);
      if (a.status === 'fulfilled') setApps(a.value);
      if (m.status === 'fulfilled') setMatches(m.value);
      setLoading(false);
    });
  }, [jobId, token]);

  const changeStatus = async (id: string, status: string) => {
    if (!token) return;
    setApps((xs) => xs.map((x) => ((x.applicationId ?? x.id) === id ? { ...x, status } : x)));
    updateApplicationStatus(id, { status }, token).catch(() => loadApps());
  };

  return (
    <DashboardShell
      nav={recruiterNav}
      kr="지원자"
      eyebrow="Tin tuyển dụng"
      title={job?.title ?? 'Ứng viên'}
      description={<Link to="/recruiter/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Về danh sách tin</Link>}
    >
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            <TabBtn active={tab === 'apps'} onClick={() => setTab('apps')} icon={<Users className="h-4 w-4" />}>Đơn ứng tuyển ({apps.length})</TabBtn>
            <TabBtn active={tab === 'matches'} onClick={() => setTab('matches')} icon={<Sparkles className="h-4 w-4" />}>AI gợi ý ({matches.length})</TabBtn>
          </div>

          {tab === 'apps' ? (
            apps.length === 0 ? (
              <EmptyState icon={<Users />} title="Chưa có ứng viên" description="Tin chưa nhận được đơn ứng tuyển nào." />
            ) : (
              <div className="flex flex-col gap-3">
                {apps.map((a) => (
                  <ApplicationRow key={a.applicationId ?? a.id} app={a} token={token!} onStatus={changeStatus} />
                ))}
              </div>
            )
          ) : matches.length === 0 ? (
            <EmptyState icon={<Sparkles />} title="Chưa có gợi ý" description="AI chưa tìm thấy ứng viên phù hợp trong hệ thống." />
          ) : (
            <div className="flex flex-col gap-3">
              {matches.map((m, i) => {
                const c = m.jobUser ?? m.candidate ?? m;
                const score = m.matchScore ?? m.score ?? m.similarity_score;
                return (
                  <div key={c.userId ?? c.id ?? i} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.fullName ?? 'Ứng viên'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {(c.skillsExtracted ?? []).slice(0, 4).join(' · ')}
                      </p>
                    </div>
                    {typeof score === 'number' && <MatchBadge score={score} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors', active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
    >
      {icon} {children}
    </button>
  );
}

function ApplicationRow({ app, token, onStatus }: { app: any; token: string; onStatus: (id: string, status: string) => void }) {
  const id = app.applicationId ?? app.id;
  const cand = app.candidate ?? app.jobUser ?? {};
  const st = appStatus(app.status);
  const [schedOpen, setSchedOpen] = useState(false);
  const [title, setTitle] = useState('Phỏng vấn vòng 1');
  const [at, setAt] = useState('');
  const [link, setLink] = useState('');
  const [done, setDone] = useState(false);

  const schedule = async () => {
    if (!at) return;
    await createInterview({ applicationId: id, title, scheduledAt: new Date(at).toISOString(), meetingLink: link || undefined }, token);
    setDone(true);
    setSchedOpen(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{cand.fullName ?? 'Ứng viên'}</p>
          <p className="truncate text-xs text-muted-foreground">{cand.user?.email ?? cand.email ?? ''}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {typeof app.matchScore === 'number' && <MatchBadge score={app.matchScore} size="sm" />}
          <Badge variant={st.variant}>{st.label}</Badge>
          <Select value={app.status} onChange={(e) => onStatus(id, e.target.value)} className="h-9 w-auto">
            {STATUSES.map((s) => <option key={s} value={s}>{appStatus(s).label}</option>)}
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSchedOpen((o) => !o)} disabled={done}>
            <CalendarPlus className="h-4 w-4" /> {done ? 'Đã hẹn' : 'Lên lịch PV'}
          </Button>
        </div>
      </div>

      {app.coverLetter && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">"{app.coverLetter}"</p>}

      {schedOpen && (
        <div className="mt-3 grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
          <Input className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" />
          <Input className="h-9" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
          <Input className="h-9 sm:col-span-2" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link phòng họp (không bắt buộc)" />
          <div className="flex gap-2 sm:col-span-2">
            <Button size="sm" onClick={schedule} disabled={!at}>Tạo lịch</Button>
            <Button size="sm" variant="ghost" onClick={() => setSchedOpen(false)}>Hủy</Button>
          </div>
        </div>
      )}
    </div>
  );
}
