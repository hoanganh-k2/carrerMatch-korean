import { Routes, Route } from 'react-router-dom';
import { CandidateDashboardPage } from './dashboard';
import { RecommendationsPage } from './recommendations';
import { SavedJobsPage } from './saved-jobs';
import { ProfilePage } from './profile';
import { ResumesPage } from './resumes';

export default function CandidateRoutes() {
  return (
    <Routes>
      <Route index element={<CandidateDashboardPage />} />
      <Route path="recommendations" element={<RecommendationsPage />} />
      <Route path="saved" element={<SavedJobsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="resumes" element={<ResumesPage />} />
    </Routes>
  );
}
