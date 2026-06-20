import { useEffect, useRef, useState } from 'react';
import { FileText, Trash2, Plus, Upload, Star, BadgeCheck } from 'lucide-react';
import {
  fetchMyResumes, createResume, updateResume, deleteResume, uploadFile, getUploadedFileUrl,
  addExperience, deleteExperience, addEducation, deleteEducation, addCertification, deleteCertification,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, candidateNav } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export function ResumesPage() {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [err, setErr] = useState('');

  const reload = () => token && fetchMyResumes(token).then(setResumes).catch(() => {});

  useEffect(() => {
    if (!token) return;
    fetchMyResumes(token).then(setResumes).catch((e) => setErr(e instanceof Error ? e.message : 'Lỗi tải CV')).finally(() => setLoading(false));
  }, [token]);

  const create = async () => {
    if (!token || !title.trim()) return;
    try {
      await createResume({ title: title.trim(), isDefault: resumes.length === 0 }, token);
      setTitle('');
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Tạo CV thất bại');
    }
  };

  return (
    <DashboardShell
      nav={candidateNav}
      kr="이력서"
      eyebrow="CV"
      title="CV của tôi"
      description="Tạo nhiều CV cho từng loại vị trí và đặt một CV mặc định."
    >
      <div className="flex flex-col gap-6">
        {/* Tạo CV mới */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm font-medium">Tên CV mới</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: CV BrSE Java" onKeyDown={(e) => e.key === 'Enter' && create()} />
            </div>
            <Button onClick={create} disabled={!title.trim()}><Plus className="h-4 w-4" /> Tạo CV</Button>
          </CardContent>
        </Card>
        {err && <p className="text-sm text-destructive">{err}</p>}

        {loading ? (
          <LoadingBlock />
        ) : resumes.length === 0 ? (
          <EmptyState icon={<FileText />} title="Chưa có CV nào" description="Tạo CV đầu tiên để bắt đầu ứng tuyển." />
        ) : (
          resumes.map((r) => <ResumeCard key={r.resumeId ?? r.id} resume={r} token={token!} onChange={reload} />)
        )}
      </div>
    </DashboardShell>
  );
}

function ResumeCard({ resume, token, onChange }: { resume: any; token: string; onChange: () => void }) {
  const id = resume.resumeId ?? resume.id;
  const fileRef = useRef<HTMLInputElement>(null);
  const fileUrl = getUploadedFileUrl(resume.fileUrl);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { url } = await uploadFile(file, 'cv', token);
    await updateResume(id, { fileUrl: url }, token);
    onChange();
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-bold">{resume.title}</h3>
            {resume.isDefault && <Badge variant="cobalt"><BadgeCheck className="h-3 w-3" /> Mặc định</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {!resume.isDefault && (
              <Button variant="ghost" size="sm" onClick={() => updateResume(id, { isDefault: true }, token).then(onChange)}>
                <Star className="h-4 w-4" /> Đặt mặc định
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> CV PDF</Button>
            <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onUpload} />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirm('Xóa CV này?') && deleteResume(id, token).then(onChange)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {fileUrl && <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">📄 Xem file CV đã tải lên</a>}

        <SectionBlock
          title="Kinh nghiệm làm việc"
          items={resume.experiences ?? []}
          render={(x) => <><b>{x.position}</b> · {x.company}</>}
          fields={[
            { key: 'position', placeholder: 'Vị trí (VD: Java Developer)' },
            { key: 'company', placeholder: 'Công ty' },
          ]}
          onAdd={(data) => addExperience(id, data, token).then(onChange)}
          onDelete={(x) => deleteExperience(x.id, token).then(onChange)}
        />
        <SectionBlock
          title="Học vấn"
          items={resume.educations ?? []}
          render={(x) => <><b>{x.degree ?? x.major}</b> · {x.school}</>}
          fields={[
            { key: 'school', placeholder: 'Trường' },
            { key: 'major', placeholder: 'Chuyên ngành' },
          ]}
          onAdd={(data) => addEducation(id, data, token).then(onChange)}
          onDelete={(x) => deleteEducation(x.id, token).then(onChange)}
        />
        <SectionBlock
          title="Chứng chỉ"
          items={resume.certifications ?? []}
          render={(x) => <><b>{x.name}</b>{x.issuer ? ` · ${x.issuer}` : ''}</>}
          fields={[
            { key: 'name', placeholder: 'Tên chứng chỉ (VD: TOPIK 4)' },
            { key: 'issuer', placeholder: 'Nơi cấp' },
          ]}
          onAdd={(data) => addCertification(id, data, token).then(onChange)}
          onDelete={(x) => deleteCertification(x.id, token).then(onChange)}
        />
      </CardContent>
    </Card>
  );
}

interface SectionField { key: string; placeholder: string }
function SectionBlock({ title, items, render, fields, onAdd, onDelete }: {
  title: string;
  items: any[];
  render: (x: any) => React.ReactNode;
  fields: SectionField[];
  onAdd: (data: Record<string, string>) => Promise<any>;
  onDelete: (x: any) => Promise<any>;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  const submit = async () => {
    if (!fields.every((f) => form[f.key]?.trim())) return;
    await onAdd(form);
    setForm({});
    setAdding(false);
  };

  return (
    <div className="rounded-md border border-border p-4">
      <p className="eyebrow mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có mục nào.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((x, i) => (
            <li key={x.id ?? i} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">{render(x)}</span>
              <button onClick={() => onDelete(x)} aria-label="Xóa" className="shrink-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {fields.map((f) => (
            <Input key={f.key} className="h-9" placeholder={f.placeholder} value={form[f.key] ?? ''} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
          ))}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit}>Lưu</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setForm({}); }}>Hủy</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className={cn('mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline')}>
          <Plus className="h-3.5 w-3.5" /> Thêm
        </button>
      )}
    </div>
  );
}
