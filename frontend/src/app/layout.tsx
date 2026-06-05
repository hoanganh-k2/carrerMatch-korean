import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CareerMatch - Sàn tìm việc IT Tiếng Hàn Thông Minh",
    template: "%s | CareerMatch IT Korean",
  },
  description:
    "Kết nối kỹ sư BrSE, IT Comtor và lập trình viên tiếng Hàn đến các doanh nghiệp công nghệ hàng đầu thông qua AI Semantic Search. Tìm việc BrSE, Comtor, Dev tiếng Hàn lương cao tại Hà Nội, TP.HCM và Seoul.",
  keywords: [
    "BrSE",
    "Comtor",
    "tiếng Hàn",
    "việc làm IT",
    "TOPIK",
    "kỹ sư cầu nối",
    "tuyển dụng",
    "CareerMatch",
  ],
  authors: [{ name: "CareerMatch Team" }],
  openGraph: {
    title: "CareerMatch - Sàn tìm việc IT Tiếng Hàn Thông Minh",
    description:
      "Tìm việc BrSE, Comtor, Dev tiếng Hàn bằng AI Semantic Search. TOPIK từ cấp 1 đến 6.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
