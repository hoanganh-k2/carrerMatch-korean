import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Building2, Users, Briefcase, ArrowRight, Globe, Brain, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickMatch } from '@/components/quick-match';
import { useAuth } from '@/context/auth-context';

export default function LandingPage() {
  const { token, role } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-sm font-bold text-primary mb-6 shadow-sm">
            <span className="text-base">안녕하세요!</span>
            <span className="text-muted-foreground font-medium text-xs">Chào mừng đến với KBRIDGE</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight text-foreground">
            Cây cầu nối sự nghiệp IT
            <span className="block mt-1.5 text-primary">Việt Nam ↔ Hàn Quốc</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed">
            Kết nối kỹ sư BrSE, IT Comtor và lập trình viên tiếng Hàn đến các doanh nghiệp công nghệ
            hàng đầu thông qua cơ chế khớp ngữ nghĩa AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md shadow-primary/20 gap-2">
              <Link to="/jobs">
                <Sparkles className="w-4 h-4" />
                Khám phá việc làm
              </Link>
            </Button>
            {!token && (
              <Button asChild variant="outline" className="h-12 px-8 rounded-xl font-bold gap-2">
                <Link to="/register">
                  <ArrowRight className="w-4 h-4" />
                  Tạo tài khoản miễn phí
                </Link>
              </Button>
            )}
            {token && role === 'candidate' && (
              <Button asChild variant="outline" className="h-12 px-8 rounded-xl font-bold gap-2">
                <Link to="/candidate/recommendations">
                  <ArrowRight className="w-4 h-4" />
                  Xem việc phù hợp với bạn
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Quick Match — tìm việc cho khách, không cần đăng nhập */}
      <QuickMatch />

      {/* Stats */}
      <section className="py-14 border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">500+</div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Tin tuyển dụng</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">120+</div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Doanh nghiệp</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">3000+</div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Ứng viên đăng ký</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b border-border">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-center text-foreground mb-2">Tại sao chọn KBRIDGE?</h2>
          <p className="text-muted-foreground text-center text-sm mb-12">Nền tảng tuyển dụng IT chuyên biệt cho thị trường Việt - Hàn</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-card border border-border rounded-2xl space-y-3 hover:border-primary/30 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">AI Semantic Search</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Tìm kiếm ngữ nghĩa thông minh bằng tiếng Việt — AI hiểu ý định, không chỉ từ khóa. Vector search pgvector + NLP.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-2xl space-y-3 hover:border-primary/30 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">AI Matching Cá nhân hóa</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Gợi ý việc làm phù hợp dựa trên hồ sơ, kỹ năng tiếng Hàn (TOPIK), kinh nghiệm và hành vi tìm kiếm của bạn.
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-2xl space-y-3 hover:border-primary/30 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Thị trường Việt - Hàn</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Chuyên biệt cho BrSE, IT Comtor, Dev tiếng Hàn. Việc làm tại Hà Nội, TP.HCM, Seoul, Remote và toàn quốc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Job categories */}
      <section className="py-16 border-b border-border bg-secondary/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-center text-foreground mb-2">Ngành nghề nổi bật</h2>
          <p className="text-muted-foreground text-center text-sm mb-10">Khám phá cơ hội việc làm theo lĩnh vực</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'BrSE / Kỹ sư cầu nối', icon: '🌉', count: '120+' },
              { label: 'IT Comtor', icon: '🗣️', count: '80+' },
              { label: 'Backend Developer', icon: '⚙️', count: '200+' },
              { label: 'Frontend / Mobile', icon: '📱', count: '150+' },
            ].map((cat) => (
              <Link
                key={cat.label}
                to={`/jobs?q=${encodeURIComponent(cat.label)}`}
                className="p-4 bg-card border border-border rounded-xl text-center hover:border-primary/40 hover:bg-accent/40 transition-all group"
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">{cat.label}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{cat.count} việc làm</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for companies */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For candidates */}
            <div className="p-8 bg-card border border-border rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Dành cho Ứng viên</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tạo hồ sơ, upload CV, nhận gợi ý việc làm cá nhân hóa và ứng tuyển chỉ với vài click. Chatbot AI hỗ trợ 24/7.
              </p>
              <div className="flex gap-3">
                <Button asChild size="sm" className="rounded-lg font-bold text-xs gap-1.5">
                  <Link to="/register">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Đăng ký ứng viên
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg font-bold text-xs">
                  <Link to="/jobs">Xem việc làm</Link>
                </Button>
              </div>
            </div>

            {/* For recruiters */}
            <div className="p-8 bg-card border border-border rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Dành cho Nhà tuyển dụng</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Đăng tin tuyển dụng, nhận danh sách ứng viên phù hợp qua AI matching, quản lý hồ sơ và lịch phỏng vấn tập trung.
              </p>
              <div className="flex gap-3">
                <Button asChild size="sm" className="rounded-lg font-bold text-xs gap-1.5">
                  <Link to="/register">
                    <Building2 className="w-3.5 h-3.5" />
                    Đăng ký nhà tuyển dụng
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="rounded-lg font-bold text-xs">
                  <Link to="/companies">Xem công ty</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Korean accent */}
      <section className="py-10 border-t border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-1 mb-3 text-amber-500">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-amber-500" />)}
          </div>
          <p className="text-foreground font-semibold text-sm italic mb-2">
            "KBRIDGE giúp tôi tìm được việc BrSE tại Seoul chỉ sau 2 tuần. AI matching cực kỳ chính xác!"
          </p>
          <span className="text-xs text-muted-foreground">— Nguyễn Văn A, BrSE tại Samsung SDS Seoul</span>
          <div className="mt-6 text-2xl font-black text-primary tracking-tight">화이팅! 🇻🇳 × 🇰🇷</div>
        </div>
      </section>
    </div>
  );
}
