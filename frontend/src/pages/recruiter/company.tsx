import { useEffect, useRef, useState } from 'react';
import { Camera, BadgeCheck } from 'lucide-react';
import { fetchMyCompany, createCompany, updateCompany, uploadFile, getUploadedFileUrl } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, recruiterNav } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingBlock } from '@/components/ui/spinner';

const EMPTY = {
  companyName: '', koreanCompanyName: '', industry: '', companySize: '', website: '', location: '', description: '', logoUrl: '',
};

export function RecruiterCompanyPage() {
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchMyCompany(token)
      .then((c) => {
        if (c && (c.companyId || c.id)) {
          setExists(true);
          setCompanyId(c.companyId ?? c.id);
          setVerified(!!(c.isVerified ?? c.is_verified));
          setForm({
            companyName: c.companyName ?? '', koreanCompanyName: c.koreanCompanyName ?? '', industry: c.industry ?? '',
            companySize: c.companySize ?? '', website: c.website ?? '', location: c.location ?? '',
            description: c.description ?? '', logoUrl: c.logoUrl ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<any>) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    const { url } = await uploadFile(file, 'logo', token);
    setForm((s) => ({ ...s, logoUrl: url }));
  };

  const save = async () => {
    if (!token) return;
    setSaving(true); setMsg(''); setErr('');
    try {
      if (exists && companyId) {
        await updateCompany(companyId, form, token);
      } else {
        const c = await createCompany(form, token);
        setExists(true);
        setCompanyId(c.companyId ?? c.id);
      }
      setMsg('Đã lưu hồ sơ công ty.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const logo = getUploadedFileUrl(form.logoUrl);

  return (
    <DashboardShell
      nav={recruiterNav}
      kr="기업 프로필"
      eyebrow="Nhà tuyển dụng"
      title="Hồ sơ công ty"
      description={exists ? 'Cập nhật thông tin doanh nghiệp của bạn.' : 'Tạo hồ sơ công ty để bắt đầu đăng tin tuyển dụng.'}
      actions={verified ? <Badge variant="cobalt"><BadgeCheck className="h-3 w-3" /> Đã xác thực</Badge> : undefined}
    >
      {loading ? (
        <LoadingBlock />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin doanh nghiệp</CardTitle>
            <CardDescription>Thông tin này hiển thị công khai với ứng viên.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => fileRef.current?.click()} className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border border-border bg-accent text-xl font-bold text-accent-foreground">
                {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : (form.companyName.charAt(0) || '·')}
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"><Camera className="h-5 w-5 text-background" /></span>
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-primary hover:underline">Tải logo</button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onLogo} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên công ty"><Input value={form.companyName} onChange={set('companyName')} placeholder="VD: FPT Software" /></Field>
              <Field label="Tên tiếng Hàn"><Input value={form.koreanCompanyName} onChange={set('koreanCompanyName')} lang="ko" placeholder="한국어 이름" /></Field>
              <Field label="Ngành"><Input value={form.industry} onChange={set('industry')} placeholder="VD: Phần mềm, Fintech" /></Field>
              <Field label="Quy mô"><Input value={form.companySize} onChange={set('companySize')} placeholder="VD: 100-500 nhân sự" /></Field>
              <Field label="Website"><Input value={form.website} onChange={set('website')} placeholder="https://..." /></Field>
              <Field label="Địa điểm"><Input value={form.location} onChange={set('location')} placeholder="VD: Hà Nội / Seoul" /></Field>
            </div>
            <Field label="Giới thiệu"><Textarea value={form.description} onChange={set('description')} placeholder="Mô tả về công ty…" className="min-h-32" /></Field>

            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving || !form.companyName.trim()}>{saving ? 'Đang lưu…' : exists ? 'Lưu thay đổi' : 'Tạo hồ sơ công ty'}</Button>
              {msg && <span className="text-sm text-primary">{msg}</span>}
              {err && <span className="text-sm text-destructive">{err}</span>}
            </div>
          </CardContent>
        </Card>
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
