import { useEffect, useRef, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import {
  fetchNotifications, fetchUnreadNotificationsCount, markNotificationRead,
  markAllNotificationsRead, deleteNotification,
} from '@/lib/api';
import { timeAgo, cn } from '@/lib/utils';

interface NotiItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsMenu() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotiItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchUnreadNotificationsCount(token).then((r) => setUnread(r.unreadCount)).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!open || !token) return;
    fetchNotifications(token).then(setItems).catch(() => {});
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, token]);

  if (!token) return null;

  const onRead = async (id: string) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, isRead: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    markNotificationRead(id, token).catch(() => {});
  };

  const onReadAll = async () => {
    setItems((xs) => xs.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    markAllNotificationsRead(token).catch(() => {});
  };

  const onDelete = async (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    deleteNotification(id, token).catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Thông báo"
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-star px-1 text-[10px] font-bold text-star-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Thông báo</span>
            {items.some((x) => !x.isRead) && (
              <button onClick={onReadAll} className="text-xs text-primary hover:underline">Đọc tất cả</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Chưa có thông báo nào</p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn('group flex gap-2 border-b border-border px-4 py-3 last:border-0', !n.isRead && 'bg-accent/50')}
                >
                  <button onClick={() => !n.isRead && onRead(n.id)} className="min-w-0 flex-1 text-left">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                  </button>
                  <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {!n.isRead && (
                      <button onClick={() => onRead(n.id)} aria-label="Đánh dấu đã đọc" className="rounded p-1 hover:bg-accent"><Check className="h-3.5 w-3.5" /></button>
                    )}
                    <button onClick={() => onDelete(n.id)} aria-label="Xóa" className="rounded p-1 text-muted-foreground hover:bg-accent"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
