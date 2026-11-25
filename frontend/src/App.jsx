import { Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import AppLayout from './components/AppLayout';
import { GuestRoute, ProtectedRoute, ScrollManager } from './components/RouteGuards';
import Landing from './pages/Landing';
import { Login, Register, ForgotPassword, ResetPassword } from './pages/Auth';
import { About, Contact, Privacy, Terms, NotFound } from './pages/Static';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Report from './pages/Report';
import Careers from './pages/Careers';
import SkillGap from './pages/SkillGap';
import Improvements from './pages/Improvements';
import Profile from './pages/Profile';
import History from './pages/History';

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="analyze" element={<Analyzer />} />
            <Route path="report/:id" element={<Report />} />
            <Route path="careers" element={<Careers />} />
            <Route path="skill-gap" element={<SkillGap />} />
            <Route path="improvements" element={<Improvements />} />
            <Route path="history" element={<History />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
