import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";
import JobDetail from "@/pages/JobDetail";
import ForEmployers from "@/pages/ForEmployers";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";

import CandidateLogin from "@/pages/candidate/Login";
import CandidateSignup from "@/pages/candidate/Signup";
import CandidateProfile from "@/pages/candidate/Profile";
import CandidateApply from "@/pages/candidate/Apply";
import CandidateApplications from "@/pages/candidate/Applications";

import EmployerLogin from "@/pages/employer/Login";
import EmployerSignup from "@/pages/employer/Signup";
import EmployerProfile from "@/pages/employer/Profile";
import EmployerPlans from "@/pages/employer/Plans";
import EmployerDashboard from "@/pages/employer/Dashboard";
import EmployerJobNew from "@/pages/employer/JobNew";
import EmployerJobEdit from "@/pages/employer/JobEdit";
import EmployerApplicants from "@/pages/employer/Applicants";
import EmployerShortlisted from "@/pages/employer/Shortlisted";

// Routes where the split-screen AuthShell handles its own chrome.
const AUTH_PREFIXES = [
  "/candidate/login",
  "/candidate/signup",
  "/employer/login",
  "/employer/signup",
];

// Routes where we want a navbar but no marketing footer (app-like surfaces).
const APP_ROUTES = [
  "/me/profile",
  "/me/applications",
  "/employer",
  "/employer/profile",
  "/employer/jobs/new",
  "/employer/shortlisted",
];
const APP_PATTERNS = [
  /^\/employer\/jobs\/[^/]+\/applicants$/,
  /^\/employer\/jobs\/[^/]+\/edit$/,
];

function Shell() {
  const { pathname } = useLocation();
  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p));
  const isApp =
    !isAuth &&
    (APP_ROUTES.includes(pathname) || APP_PATTERNS.some((re) => re.test(pathname)));
  const showNavbar = !isAuth;
  const showFooter = !isAuth && !isApp;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {showNavbar && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/apply" element={<CandidateApply />} />
          <Route path="/for-employers" element={<ForEmployers />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          <Route path="/candidate/login" element={<CandidateLogin />} />
          <Route path="/candidate/signup" element={<CandidateSignup />} />
          <Route path="/me/profile" element={<CandidateProfile />} />
          <Route path="/me/applications" element={<CandidateApplications />} />

          <Route path="/employer/login" element={<EmployerLogin />} />
          <Route path="/employer/signup" element={<EmployerSignup />} />
          <Route path="/employer/profile" element={<EmployerProfile />} />
          <Route path="/employer/plans" element={<EmployerPlans />} />
          <Route path="/employer" element={<EmployerDashboard />} />
          <Route path="/employer/shortlisted" element={<EmployerShortlisted />} />
          <Route path="/employer/jobs/new" element={<EmployerJobNew />} />
          <Route path="/employer/jobs/:jobId/edit" element={<EmployerJobEdit />} />
          <Route path="/employer/jobs/:jobId/applicants" element={<EmployerApplicants />} />
        </Routes>
      </main>
      {showFooter && <Footer />}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
