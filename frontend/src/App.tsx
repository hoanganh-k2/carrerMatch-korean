import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { AuthModal } from '@/components/auth-modal';
import { ChatbotDrawer } from '@/components/chatbot-drawer';
import { RequireRole } from '@/components/guards/require-role';
import { useAuth, homePathForRole, UserRole } from '@/context/auth-context';

import HomePage from '@/pages/home';
import CandidateDashboardPage from '@/pages/candidate/dashboard';
import RecommendationsPage from '@/pages/candidate/recommendations';
import ProfilePage from '@/pages/candidate/profile';
import ResumesPage from '@/pages/candidate/resumes';
import SavedJobsPage from '@/pages/candidate/saved-jobs';
import RecruiterDashboardPage from '@/pages/recruiter/dashboard';
import CompanyPage from '@/pages/recruiter/company';
import RecruiterJobsPage from '@/pages/recruiter/jobs';
import RecruiterJobDetailPage from '@/pages/recruiter/job-detail';
import AdminDashboardPage from '@/pages/admin/dashboard';

export default function App() {
  const { signIn, role } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const handleAuthSuccess = async (data: {
    accessToken: string;
    user: { id: string; email: string; role: string };
    fullName?: string;
  }) => {
    const newRole = await signIn(data);
    navigate(homePathForRole(newRole));
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col pb-20">
      <AppHeader onLoginClick={() => setShowAuthModal(true)} />

      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Candidate */}
        <Route
          path="/candidate"
          element={
            <RequireRole roles={['candidate']}>
              <CandidateDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/candidate/recommendations"
          element={
            <RequireRole roles={['candidate']}>
              <RecommendationsPage />
            </RequireRole>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <RequireRole roles={['candidate']}>
              <ProfilePage />
            </RequireRole>
          }
        />
        <Route
          path="/candidate/resumes"
          element={
            <RequireRole roles={['candidate']}>
              <ResumesPage />
            </RequireRole>
          }
        />
        <Route
          path="/candidate/saved"
          element={
            <RequireRole roles={['candidate']}>
              <SavedJobsPage />
            </RequireRole>
          }
        />

        {/* Recruiter */}
        <Route
          path="/recruiter"
          element={
            <RequireRole roles={['recruiter']}>
              <RecruiterDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/recruiter/company"
          element={
            <RequireRole roles={['recruiter']}>
              <CompanyPage />
            </RequireRole>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <RequireRole roles={['recruiter']}>
              <RecruiterJobsPage />
            </RequireRole>
          }
        />
        <Route
          path="/recruiter/jobs/:jobId"
          element={
            <RequireRole roles={['recruiter']}>
              <RecruiterJobDetailPage />
            </RequireRole>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireRole roles={['admin']}>
              <AdminDashboardPage />
            </RequireRole>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Routes>

      {/* Floating Chatbot (ưu tiên candidate; khách cũng thấy để được mời đăng nhập) */}
      {(!role || role === 'candidate') && (
        <div className="fixed bottom-6 right-6 z-40">
          {!chatbotOpen ? (
            <Button
              onClick={() => setChatbotOpen(true)}
              className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          ) : (
            <ChatbotDrawer
              isOpen={chatbotOpen}
              onClose={() => setChatbotOpen(false)}
              onLoginClick={() => {
                setChatbotOpen(false);
                setShowAuthModal(true);
              }}
            />
          )}
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

// Re-export để các trang khác dùng nếu cần điều hướng theo role
export type { UserRole };
