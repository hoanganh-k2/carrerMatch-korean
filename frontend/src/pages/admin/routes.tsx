import { Routes, Route } from 'react-router-dom';
import { AdminDashboardPage } from './dashboard';
import { AdminUsersPage } from './users';
import { AdminJobsPage } from './jobs';
import { AdminReviewsPage } from './reviews';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<AdminDashboardPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="jobs" element={<AdminJobsPage />} />
      <Route path="reviews" element={<AdminReviewsPage />} />
    </Routes>
  );
}
