import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { googleLoginApi } from '@/lib/api';
import { useAuth, homePathForRole } from '@/context/auth-context';

// Khai báo tối thiểu cho Google Identity Services (script nạp trong index.html)
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (resp: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

/**
 * Nút "Đăng nhập bằng Google" dùng Google Identity Services (luồng ID token).
 * Lấy credential rồi gọi backend /auth/google, sau đó signIn như đăng nhập thường.
 */
export function GoogleLoginButton() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const btnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const handleCredential = useCallback(
    async (resp: { credential: string }) => {
      setError(null);
      try {
        const result = await googleLoginApi(resp.credential);
        const role = await signIn(result);
        navigate(homePathForRole(role), { replace: true });
      } catch (e: any) {
        setError(e?.message || 'Đăng nhập Google thất bại');
      }
    },
    [signIn, navigate],
  );

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const tryInit = () => {
      if (cancelled) return;
      const id = window.google?.accounts?.id;
      if (id && btnRef.current) {
        id.initialize({ client_id: clientId, callback: handleCredential });
        id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 320,
          locale: 'vi',
        });
      } else {
        // Script GIS nạp async — thử lại tới khi sẵn sàng
        setTimeout(tryInit, 300);
      }
    };
    tryInit();

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredential]);

  if (!clientId) {
    return (
      <div className="p-3 rounded-xl bg-secondary/60 border border-dashed border-border text-[11px] text-muted-foreground text-center">
        Đăng nhập Google chưa bật — hãy điền <span className="font-semibold">VITE_GOOGLE_CLIENT_ID</span> vào{' '}
        <span className="font-semibold">frontend/.env</span>.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={btnRef} className="flex justify-center min-h-[40px]" />
      {error && (
        <div className="text-[11px] text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
