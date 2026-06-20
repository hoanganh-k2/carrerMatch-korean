import { Routes, Route } from 'react-router-dom';
import { RecruiterDashboardPage } from './dashboard';
import { RecruiterJobsPage } from './jobs';
import { RecruiterJobDetailPage } from './job-detail';
import { RecruiterCompanyPage } from './company';

export default function RecruiterRoutes() {
  return (
    <Routes>
      <Route index element={<RecruiterDashboardPage />} />
      <Route path="jobs" element={<RecruiterJobsPage />} />
      <Route path="jobs/:jobId" element={<RecruiterJobDetailPage />} />
      <Route path="company" element={<RecruiterCompanyPage />} />
    </Routes>
  );
}
