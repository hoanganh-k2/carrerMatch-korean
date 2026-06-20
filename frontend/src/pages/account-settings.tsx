import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { uploadFile, updateMyAccount, changePassword, deleteMyAccount, getUploadedFileUrl } from '@/lib/api';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function Note({ tone, children }: { tone: 'ok' | 'err'; children: React.ReactNode }) {
  if (!children) return null;
  return <p className={tone === 'ok' ? 'text-sm text-primary' : 'text-sm text-destructive'}>{children}</p>;
}

export function AccountSettingsPage() {
  const { token, email, displayName, avatarUrl, updateAvatar, signOut } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState(email ?? '');
  const [accMsg, setAccMsg] = useState('');
  const [accErr, setAccErr] = useState('');
  const [savingAcc, setSavingAcc] = useState(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  if (!token) return null;

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAccErr('');
    try {
      const { url } = await uploadFile(file, 'avatar', token);
      await updateMyAccount({ avatarUrl: url }, token);
      updateAvatar(getUploadedFileUrl(url));
      setAccMsg('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      setAccErr(err instanceof Error ? err.message : 'Tải ảnh thất bại');
    }
  };

  const saveEmail = async () => {
    setSavingAcc(true); setAccMsg(''); setAccErr('');
    try {
      await updateMyAccount({ email: newEmail }, token);
      setAccMsg('Đã lưu thông tin tài khoản.');
    } catch (err) {
      setAccErr(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSavingAcc(false);
    }
  };

  const savePassword = async () => {
    setSavingPw(true); setPwMsg(''); setPwErr('');
    try {
      await changePassword({ currentPassword: curPw, newPassword: newPw }, token);
      setPwMsg('Đã đổi mật khẩu.');
      setCurPw(''); setNewPw('');
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
    } finally {
      setSavingPw(false);
    }
  };

  const removeAccount = async () => {
    if (!confirm('Bạn chắc chắn muốn xoá tài khoản? Hành động này không thể hoàn tác.')) return;
    try {
      await deleteMyAccount(token);
      signOut();
      navigate('/');
    } catch (err) {
      setAccErr(err instanceof Error ? err.message : 'Xoá tài khoản thất bại');
    }
  };

  const avatar = getUploadedFileUrl(avatarUrl);
  const initial = (displayName ?? '?').trim().charAt(0).toUpperCase();

  return (
    <Section>
      <Container className="max-w-2xl">
        <PageHeader kr="계정 설정" eyebrow="Tài khoản" title="Cài đặt tài khoản" />

        <div className="mt-8 flex flex-col gap-6">
          {/* Thông tin tài khoản */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>Ảnh đại diện và email đăng nhập.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-primary-foreground"
                >
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-background" />
                  </span>
                </button>
                <div>
                  <p className="font-medium">{displayName}</p>
                  <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-primary hover:underline">Đổi ảnh đại diện</button>
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onAvatar} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <Note tone="ok">{accMsg}</Note>
              <Note tone="err">{accErr}</Note>
              <div><Button onClick={saveEmail} disabled={savingAcc}>{savingAcc ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div>
            </CardContent>
          </Card>

          {/* Đổi mật khẩu */}
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Để trống nếu đăng nhập bằng Google.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="curpw" className="text-sm font-medium">Mật khẩu hiện tại</label>
                <Input id="curpw" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="newpw" className="text-sm font-medium">Mật khẩu mới</label>
                <Input id="newpw" type="password" minLength={8} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
              <Note tone="ok">{pwMsg}</Note>
              <Note tone="err">{pwErr}</Note>
              <div><Button onClick={savePassword} disabled={savingPw || !curPw || !newPw}>{savingPw ? 'Đang đổi…' : 'Đổi mật khẩu'}</Button></div>
            </CardContent>
          </Card>

          {/* Vùng nguy hiểm */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Xoá tài khoản</CardTitle>
              <CardDescription>Xoá vĩnh viễn tài khoản và dữ liệu liên quan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10" onClick={removeAccount}>
                Xoá tài khoản của tôi
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
