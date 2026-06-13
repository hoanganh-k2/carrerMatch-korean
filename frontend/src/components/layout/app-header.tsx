import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogIn, LogOut, Trash2, Camera, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  uploadFile,
  updateMyAccount,
  getUploadedFileUrl,
} from '@/lib/api';

const NAV_BY_ROLE: Record<string, Array<{ to: string; label: string }>> = {
  candidate: [
    { to: '/jobs', label: 'Tìm việc' },
    { to: '/candidate/recommendations', label: 'Dành cho bạn' },
    { to: '/candidate', label: 'Dashboard' },
    { to: '/candidate/resumes', label: 'CV của tôi' },
    { to: '/candidate/saved', label: 'Đã lưu' },
    { to: '/candidate/profile', label: 'Hồ sơ' },
  ],
  recruiter: [
    { to: '/jobs', label: 'Việc làm' },
    { to: '/recruiter', label: 'Dashboard' },
    { to: '/recruiter/jobs', label: 'Tin tuyển dụng' },
    { to: '/recruiter/company', label: 'Công ty' },
  ],
  admin: [
    { to: '/jobs', label: 'Việc làm' },
    { to: '/admin', label: 'Quản trị' },
    { to: '/admin/users', label: 'Người dùng' },
    { to: '/admin/jobs', label: 'Kiểm duyệt tin' },
    { to: '/admin/reviews', label: 'Đánh giá' },
  ],
};

const PUBLIC_NAV = [
  { to: '/', label: 'Trang chủ' },
  { to: '/jobs', label: 'Việc làm' },
  { to: '/companies', label: 'Công ty' },
];

export function AppHeader({ onLoginClick }: { onLoginClick: () => void }) {
  const { token, role, email, displayName, avatarUrl, signOut, updateAvatar } = useAuth();
  const navigate = useNavigate();

  // Upload avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!token || !file) return;
    setUploadingAvatar(true);
    try {
      const { url } = await uploadFile(file, 'avatar', token);
      await updateMyAccount({ avatarUrl: url }, token);
      updateAvatar(url);
    } catch (err: any) {
      alert(err.message || 'Tải ảnh đại diện thất bại');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // User dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const [notifs, countData] = await Promise.all([
        fetchNotifications(token),
        fetchUnreadNotificationsCount(token),
      ]);
      setNotifications(notifs);
      setUnreadCount(countData.unreadCount);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await markNotificationRead(id, token);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await markAllNotificationsRead(token);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    try {
      await deleteNotification(id, token);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    signOut();
    navigate('/');
  };

  const navLinks = role ? NAV_BY_ROLE[role] : PUBLIC_NAV;
  const roleLabel =
    role === 'candidate' ? 'Ứng viên' : role === 'recruiter' ? 'Nhà tuyển dụng' : 'Admin';

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo KBRIDGE */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
            <span className="font-extrabold text-lg text-primary-foreground tracking-tighter">K</span>
          </div>
          <div className="leading-none">
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              K<span className="text-primary">BRIDGE</span>
            </span>
            <span className="block text-[9px] font-semibold text-muted-foreground tracking-[0.18em] uppercase mt-0.5">
              IT 한국어 Careers
            </span>
          </div>
        </Link>

        {/* Navigation theo role */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/' || link.to === '/jobs' || link.to === '/companies' || link.to === '/candidate' || link.to === '/recruiter' || link.to === '/admin'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Chuông thông báo */}
          {token && (
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shadow-md">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50 flex flex-col max-h-[360px]">
                  <div className="px-4 py-3 bg-secondary border-b border-border flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Thông báo của bạn</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-primary hover:underline font-semibold text-[11px]"
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-muted-foreground text-xs italic">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          className={`p-3 text-left cursor-pointer flex gap-2 justify-between items-start transition-colors ${
                            !notif.isRead ? 'bg-accent/60 hover:bg-accent' : 'hover:bg-secondary'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">
                              {notif.title}
                            </span>
                            <p className="text-foreground/80 text-[11px] leading-relaxed">{notif.message}</p>
                            <span className="text-[9px] text-muted-foreground block">
                              {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                            className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tài khoản */}
          {token ? (
            <div className="relative" ref={userMenuRef}>
              <Button
                onClick={() => setShowUserMenu(!showUserMenu)}
                variant="ghost"
                className="rounded-lg text-xs font-bold py-2 px-2.5 flex items-center gap-2 border border-border hover:bg-secondary"
              >
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={getUploadedFileUrl(avatarUrl)}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-extrabold text-primary-foreground">
                      {(displayName || email || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate text-foreground">
                  {displayName || email}
                </span>
              </Button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 bg-secondary border-b border-border flex items-center gap-3">
                    {/* Avatar có thể bấm để đổi ảnh */}
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      title="Đổi ảnh đại diện"
                      className="relative w-12 h-12 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0 group"
                    >
                      {avatarUrl ? (
                        <img
                          src={getUploadedFileUrl(avatarUrl)}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-extrabold text-primary-foreground">
                          {(displayName || email || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingAvatar ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </span>
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <div className="min-w-0">
                      <span className="block font-bold text-xs text-foreground truncate">{displayName}</span>
                      <span className="block text-[11px] text-muted-foreground truncate">{email}</span>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-accent text-accent-foreground">
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/account/settings');
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-foreground hover:bg-secondary flex items-center gap-2 transition-all"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Cài đặt tài khoản</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={onLoginClick}
                variant="ghost"
                className="rounded-lg text-xs font-bold py-2 px-3 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                <span>Đăng nhập</span>
              </Button>
              <Button
                onClick={() => navigate('/register')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold py-2 px-4 shadow-md shadow-primary/20"
              >
                <span>Đăng ký</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
