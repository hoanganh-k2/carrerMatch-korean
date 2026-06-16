# KBRIDGE — CareerMatch Korean

Nền tảng kết nối việc làm dành cho người Việt làm việc tại Hàn Quốc (và doanh nghiệp Hàn tuyển dụng nhân sự Việt). Hệ thống gợi ý việc làm bằng AI (Google Gemini + vector embeddings), quản lý hồ sơ ứng viên, tin tuyển dụng, ứng tuyển, phỏng vấn và đánh giá công ty.

> Theme **KBRIDGE**: Hanji cream `#F7F3EE`, Dancheong red `#C84B31`, navy `#1A1A2E`. Giao diện tiếng Việt, điểm nhấn tiếng Hàn.

---

## Kiến trúc

```
careermatch-korean/
├── backend/     # API — NestJS 11 + Prisma 7 + PostgreSQL (+ pgvector)
└── frontend/    # Web — Vite 8 + React 19 + TypeScript + Tailwind CSS 4
```

### Công nghệ chính

| Tầng      | Stack                                                                       |
| --------- | --------------------------------------------------------------------------- |
| Backend   | NestJS 11, Prisma 7, PostgreSQL, JWT + Passport, bcrypt                      |
| AI / Search | Google Gemini (`@google/genai`), embeddings (`@xenova/transformers`), tìm kiếm vector |
| Email     | Resend                                                                       |
| Frontend  | React 19, React Router 7, Tailwind CSS 4, shadcn/Radix UI, Lucide icons      |

### Các module backend chính

`auth` · `users` · `job-users` · `companies` · `resumes` · `job-postings` · `job-applications` · `saved-jobs` · `interviews` · `reviews` · `notifications` · `subscriptions` · `career-events` · `skill-taxonomy` · `search` · `ai` · `dashboard` · `roles-permissions` · `uploads` · `mail`

---

## Yêu cầu hệ thống

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14 (khuyến nghị bật extension `pgvector` cho tìm kiếm theo embedding)
- API key của **Google AI Studio** (Gemini) và **Resend** (gửi email)

---

## Cài đặt & chạy

### 1. Backend

```bash
cd backend
npm install

# Tạo file .env (xem mẫu bên dưới), rồi áp dụng schema vào DB:
npx prisma migrate deploy      # hoặc: npx prisma migrate dev
npx prisma generate

# (tuỳ chọn) seed dữ liệu mẫu:
npx prisma db seed             # hoặc: npx ts-node prisma/seed.ts

# Chạy dev (watch):
npm run start:dev
```

Backend mặc định chạy tại **http://localhost:3000** (theo `PORT` trong `.env`).

#### `backend/.env`

```env
# Kết nối PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/careermatch_db?schema=public"

# Google AI Studio (Gemini) — https://aistudio.google.com
GEMINI_API_KEY="your-gemini-api-key"

# Ký & xác thực JWT
JWT_SECRET="your-strong-jwt-secret"

# Cổng API
PORT=3000

# Resend — https://resend.com
RESEND_API_KEY="your-resend-api-key"
MAIL_FROM="KBRIDGE <onboarding@resend.dev>"
```

> ⚠️ Không commit file `.env` chứa key thật lên git. Hãy dùng key của riêng bạn.

#### Tiện ích embeddings (tìm kiếm AI)

```bash
npx ts-node src/populate-embeddings.ts        # tạo embedding cho tin tuyển dụng
npx ts-node src/populate-user-embeddings.ts   # tạo embedding cho hồ sơ ứng viên
```

### 2. Frontend

```bash
cd frontend
npm install

# Tạo file .env từ mẫu:
cp .env.example .env

npm run dev
```

Frontend chạy tại **http://localhost:5173**.

#### `frontend/.env`

```env
# Trỏ tới backend (phải khớp PORT của backend)
VITE_API_URL=http://localhost:3000
```

---

## Scripts hữu ích

### Backend

| Lệnh                  | Mô tả                          |
| --------------------- | ------------------------------ |
| `npm run start:dev`   | Chạy dev với watch             |
| `npm run start:prod`  | Chạy bản build production       |
| `npm run build`       | Build NestJS                   |
| `npm run lint`        | ESLint + tự sửa                |
| `npm run test`        | Chạy unit test (Jest)          |
| `npm run test:e2e`    | Chạy end-to-end test           |

### Frontend

| Lệnh              | Mô tả                  |
| ----------------- | ---------------------- |
| `npm run dev`     | Dev server (Vite)      |
| `npm run build`   | Build production       |
| `npm run preview` | Xem thử bản build      |
| `npm run lint`    | ESLint                 |

---

## Phân quyền (Roles)

Hệ thống có các vai trò: ứng viên (candidate), nhà tuyển dụng (recruiter) và quản trị (admin). Route frontend được bảo vệ qua `src/components/guards/require-role.tsx`; token JWT lưu ở `localStorage` (key `cm_token`).

---

## Ghi chú

- Toàn bộ giao diện dùng token màu trong `frontend/src/globals.css` — không hardcode màu.
- Mọi lời gọi API đi qua `frontend/src/lib/api.ts` (đọc `VITE_API_URL`).
- Đảm bảo `VITE_API_URL` (frontend) và `PORT` (backend) khớp nhau để tránh lỗi kết nối.
