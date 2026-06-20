import { useEffect, useRef, useState } from 'react';
import { googleLoginApi } from '@/lib/api';

interface GoogleLoginButtonProps {
  /** Gọi khi backend trả về phiên đăng nhập ({ accessToken, user }) */
  onSuccess: (data: any) => void;
  onError?: (message: string) => void;
}

/**
 * Nút đăng nhập Google (Google Identity Services).
 * GIS được nạp qua <script> trong index.html; client id lấy từ VITE_GOOGLE_CLIENT_ID.
 */
export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setUnavailable(true);
      return;
    }

    let cancelled = false;

    const handleCredential = async (response: { credential: string }) => {
      try {
        const data = await googleLoginApi(response.credential);
        if (!cancelled) onSuccess(data);
      } catch (e) {
        onError?.(e instanceof Error ? e.message : 'Đăng nhập Google thất bại');
      }
    };

    // GIS nạp bất đồng bộ — chờ window.google sẵn sàng
    const tryInit = () => {
      const g = window.google;
      if (!g?.accounts?.id || !ref.current) return false;
      g.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
      g.accounts.id.renderButton(ref.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(ref.current.clientWidth || 320, 400),
      });
      return true;
    };

    if (!tryInit()) {
      const id = window.setInterval(() => {
        if (tryInit() || cancelled) window.clearInterval(id);
      }, 200);
      window.setTimeout(() => window.clearInterval(id), 5000);
      return () => {
        cancelled = true;
        window.clearInterval(id);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  if (unavailable) return null;
  return <div ref={ref} className="flex min-h-[44px] w-full justify-center" />;
}
