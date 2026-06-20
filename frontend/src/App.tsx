import { Suspense, lazy, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare } from 'lucide-react';

import { pageVariants } from '@/lib/motion';
import { useAuth, type UserRole } from '@/context/auth-context';
import { AppHeader } from '@/components/layout/app-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { ChatbotDrawer } from '@/components/chatbot-drawer';
import { RequireRole } from '@/components/guards/require-role';
import { NotFound } from '@/pages/not-found';

import { QuickMatchPage } from '@/pages/quick-match';
import { ReadinessPage } from '@/pages/readiness';
import { JobsPage } from '@/pages/jobs';
import { JobDetailPage } from '@/pages/job-detail';
import { CompaniesPage } from '@/pages/companies';
import { CompanyDetailPage } from '@/pages/company-detail';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { ForgotPasswordPage } from '@/pages/forgot-password';
import { ResetPasswordPage } from '@/pages/reset-password';
import { VerifyEmailPage } from '@/pages/verify-email';
import { AccountSettingsPage } from '@/pages/account-settings';

// Landing chứa hero cinematic (GSAP) — lazy-load để tách thành chunk riêng,
// các trang khác không phải tải GSAP.
const LandingPage = lazy(() => import('@/pages/landing'));

// Dashboard theo role — lazy-load để chunk public không gánh code khu vực đăng nhập.
const CandidateRoutes = lazy(() => import('@/pages/candidate/routes'));
const RecruiterRoutes = lazy(() => import('@/pages/recruiter/routes'));
const AdminRoutes = lazy(() => import('@/pages/admin/routes'));

const ALL_ROLES: UserRole[] = ['candidate', 'recruiter', 'admin'];

export default function App() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chatbotOpen, setChatbotOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      <SmoothScroll />
      <AppHeader onLoginClick={() => navigate('/login')} />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1"
        >
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <Routes location={location}>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/quick-match" element={<QuickMatchPage />} />
              <Route path="/readiness" element={<ReadinessPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:jobId" element={<JobDetailPage />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/companies/:companyId" element={<CompanyDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Tài khoản (mọi role đã đăng nhập) */}
              <Route
                path="/account/settings"
                element={<RequireRole roles={ALL_ROLES}><AccountSettingsPage /></RequireRole>}
              />

              {/* Dashboards theo role */}
              <Route path="/candidate/*" element={<RequireRole roles={['candidate']}><CandidateRoutes /></RequireRole>} />
              <Route path="/recruiter/*" element={<RequireRole roles={['recruiter']}><RecruiterRoutes /></RequireRole>} />
              <Route path="/admin/*" element={<RequireRole roles={['admin']}><AdminRoutes /></RequireRole>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>

      <SiteFooter />

      {/* Trợ lý AI nổi — cho khách & ứng viên */}
      {(!role || role === 'candidate') && (
        <div className="fixed bottom-5 right-5 z-40">
          {!chatbotOpen ? (
            <button
              type="button"
              onClick={() => setChatbotOpen(true)}
              aria-label="Mở trợ lý AI nghề nghiệp"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <MessageSquare className="h-6 w-6" />
            </button>
          ) : (
            <ChatbotDrawer
              isOpen={chatbotOpen}
              onClose={() => setChatbotOpen(false)}
              onLoginClick={() => {
                setChatbotOpen(false);
                navigate('/login');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export type { UserRole };
