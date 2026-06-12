# KBRIDGE Frontend

Vite + React 19 + TypeScript + Tailwind CSS 4 (KHÔNG còn là Next.js — đã migrate sang Vite).

- Theme KBRIDGE: light, ấm — Hanji cream `#F7F3EE` (background), Dancheong red `#C84B31` (primary), navy `#1A1A2E` (foreground). Token định nghĩa tại `src/globals.css` (`:root` + `@theme inline`); luôn dùng class token (`bg-background`, `text-primary`, `border-border`...) thay vì màu hardcode.
- Font: Pretendard (Hàn) + Inter — load trong `index.html`.
- Routing: react-router-dom v7, routes định nghĩa ở `src/App.tsx`, bảo vệ role bằng `src/components/guards/require-role.tsx`.
- Auth: `src/context/auth-context.tsx` (token lưu localStorage key `cm_token`).
- API client: toàn bộ gọi backend qua `src/lib/api.ts` (BASE_URL từ `VITE_API_URL`, mặc định `http://localhost:3000`).
- UI text tiếng Việt; tiếng Hàn (안녕하세요, 화이팅) chỉ dùng làm điểm nhấn.
