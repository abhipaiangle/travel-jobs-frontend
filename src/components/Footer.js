import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20">
      <div className="tj-container py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src="/opsyjobs-logo-on-dark.svg" alt="OpsyJobs" className="h-10 w-auto" />
          <p className="mt-4 text-sm text-slate-400 max-w-md">
            Full-time travel-industry hiring done right. Apply with a voice
            intro.
          </p>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Candidates</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/jobs" className="hover:text-white">
                Browse jobs
              </Link>
            </li>
            <li>
              <Link to="/candidate/signup" className="hover:text-white">
                Create profile
              </Link>
            </li>
            <li>
              <Link to="/candidate/login" className="hover:text-white">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Employers</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/for-employers" className="hover:text-white">
                Why OpsyJobs
              </Link>
            </li>
            <li>
              <Link to="/employer/plans" className="hover:text-white">
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/employer/signup" className="hover:text-white">
                Post a job
              </Link>
            </li>
            <li>
              <Link to="/employer/login" className="hover:text-white">
                Employer sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="tj-container py-5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>© {new Date().getFullYear()} OpsyJobs</div>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-slate-200">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-slate-200">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
