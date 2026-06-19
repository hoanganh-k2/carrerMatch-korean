# KBRIDGE — Frontend

Giao diện web cho **KBRIDGE** (`careermatch-korean`), sàn tìm việc IT tiếng Hàn.
Stack: **Vite + React 19 + TypeScript + Tailwind CSS 4** (đã migrate khỏi Next.js).

## Yêu cầu
- Node.js 18+
- Backend NestJS đang chạy (mặc định `http://localhost:3000`) — xem `../backend`.

## Cấu hình môi trường
Tạo file `.env` (tham khảo `.env.example`):

```bash
VITE_API_URL=http://localhost:3000   # phải khớp PORT trong backend/.env
```

## Chạy dev

```bash
npm install
npm run dev
```

Mở **[http://localhost:5173](http://localhost:5173)** trên trình duyệt (cổng mặc định của Vite).

## Các lệnh khác

| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | Chạy Vite dev server (cổng 5173) |
| `npm run build` | Type-check (`tsc -b`) + build production vào `dist/` |
| `npm run preview` | Xem thử bản build production |
| `npm run lint` | Chạy ESLint |

## Cấu trúc & quy ước

- **Routing**: `react-router-dom` v7 — routes khai báo trong `src/App.tsx`, route theo role bọc bằng `src/components/guards/require-role.tsx`.
- **Gọi API**: tập trung tại `src/lib/api.ts` (đọc `VITE_API_URL`); dùng các hàm `normalize*` để chuẩn hoá dữ liệu snake_case/camelCase từ backend.
- **Auth**: `src/context/auth-context.tsx`, token lưu ở `localStorage` key `cm_token`.
- **Theme**: token định nghĩa ở `src/globals.css` (Hanji cream `#F7F3EE`, Dancheong red `#C84B31`, navy `#1A1A2E`); luôn dùng class token (`bg-background`, `text-primary`...) thay vì màu hardcode.
- **UI**: shadcn + radix-ui + lucide-react; gộp className bằng `cn()` trong `src/lib/utils.ts`.
- **Ngôn ngữ**: text tiếng Việt; tiếng Hàn (안녕하세요, 화이팅) chỉ làm điểm nhấn.

> Chi tiết quy ước cho AI agent: xem `AGENTS.md`.
