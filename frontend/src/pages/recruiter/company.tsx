import React, { useEffect, useState } from 'react';
import { Building2, Save, Loader2, AlertCircle, CheckCircle2, BadgeCheck, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { fetchMyCompany, createCompany, updateCompany, uploadFile, getUploadedFileUrl } from '@/lib/api';

const inputClass =
  'w-full px-3 py-2.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all';

export default function CompanyPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [koreanCompanyName, setKoreanCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('Information Technology');
  const [companySize, setCompanySize] = useState('1-50');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchMyCompany(token)
      .then((c) => {
        if (!c || !c.companyId) return;
        setCompanyId(c.companyId);
        setIsVerified(Boolean(c.isVerified));
        setCompanyName(c.companyName ?? '');
        setKoreanCompanyName(c.koreanCompanyName ?? '');
        setWebsite(c.website ?? '');
        setIndustry(c.industry ?? 'Information Technology');
        setCompanySize(c.companySize ?? '1-50');
        setLocation(c.location ?? '');
        setDescription(c.description ?? '');
        setLogoUrl(c.logoUrl ?? null);
      })
      .catch(() => {
        // Chưa có công ty → form trống để tạo mới
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files?.[0]) return;
    setUploadingLogo(true);
    try {
      const result = await uploadFile(e.target.files[0], 'logo', token);
      setLogoUrl(result.url);
    } catch (err: any) {
      alert(err.message || 'Tải logo thất bại');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !companyName.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        companyName: companyName.trim(),
        koreanCompanyName: koreanCompanyName.trim() || undefined,
        website: website.trim() || undefined,
        industry,
        companySize,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        logoUrl: logoUrl || undefined,
      };
      if (companyId) {
        await updateCompany(companyId, payload, token);
      } else {
        const created = await createCompany(payload, token);
        setCompanyId(created.companyId ?? null);
      }
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Lưu hồ sơ công ty thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Công ty</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Hồ sơ công ty
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {companyId
              ? 'Cập nhật thông tin hiển thị với ứng viên.'
              : 'Tạo hồ sơ công ty để bắt đầu đăng tin tuyển dụng.'}
          </p>
        </div>
        {companyId && (
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              isVerified
                ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
                : 'bg-amber-500/10 text-amber-700 border border-amber-500/25'
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            {isVerified ? 'Đã xác thực' : 'Chờ admin duyệt'}
          </span>
        )}
      </div>

      {success && (
        <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Đã lưu hồ sơ công ty thành công!</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-md bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-card border border-border rounded-lg p-6 space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-md bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img src={getUploadedFileUrl(logoUrl)} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
              {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              Tải logo công ty
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tên công ty *
            </label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputClass} required placeholder="VD: Hanbit IT Solutions" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tên tiếng Hàn (회사명)
            </label>
            <input value={koreanCompanyName} onChange={(e) => setKoreanCompanyName(e.target.value)} className={inputClass} placeholder="VD: 한빛 IT 솔루션" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Website
            </label>
            <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ngành
            </label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quy mô
            </label>
            <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className={inputClass}>
              {['1-50', '51-200', '201-500', '500+'].map((s) => (
                <option key={s} value={s}>{s} nhân viên</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Trụ sở
            </label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="VD: Seoul / Hà Nội" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Giới thiệu công ty
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Văn hóa công ty, dự án tiêu biểu, chế độ đãi ngộ..."
          />
        </div>

        <Button
          type="submit"
          disabled={saving || !companyName.trim()}
          className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-md shadow-md shadow-primary/20 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{companyId ? 'Cập nhật hồ sơ' : 'Tạo hồ sơ công ty'}</span>
        </Button>
      </form>
    </main>
  );
}
