import { Link } from "react-router-dom";
import { Plane } from "lucide-react";

/** Split-screen auth shell — dark side with brand story, light side with form. */
export default function AuthShell({ side, title, subtitle, children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="bg-slate-950 text-white relative overflow-hidden hidden lg:block">
        <div className="absolute inset-0 tj-grid-bg opacity-20" />
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(circle at 20% 30%, rgba(71, 115, 228, 0.28), transparent 55%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.15), transparent 50%)",
        }} />
        <div className="relative h-full p-12 flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-white text-slate-900 grid place-items-center">
              <Plane className="h-4 w-4" strokeWidth={2.2} />
            </div>
            <div className="font-display text-lg font-semibold">
              Opsy<span className="text-blue-400">Jobs</span>
            </div>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight">
              {side === "employer"
                ? "Hire travel talent. In hours, not weeks."
                : "Land your next role at a travel agency."}
            </h2>
            <p className="mt-4 text-slate-300 text-base max-w-md">
              {side === "employer"
                ? "Post full-time travel roles and reach candidates who've already done a 60-second voice intro. Less back-and-forth, fewer no-shows."
                : "Apply once. Reuse your profile, resume, and voice intro on every job. Employers hear you before they call."}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              {(side === "employer"
                ? [
                    "Subscription unlocks unlimited applicant access",
                    "Voice-intro screening saves recruiter hours",
                    "Constrained to travel-industry roles only",
                  ]
                : [
                    "Full-time roles only — no gig or commission-only listings",
                    "One profile, one-click apply everywhere",
                    "Voice intro you can re-record any time",
                  ]
              ).map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-blue-400" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            © {new Date().getFullYear()} OpsyJobs · by
            <img src="/ht-logo.png" alt="HelloTravel" className="h-6 w-auto" />
          </div>
        </div>
      </div>

      <div className="flex flex-col p-6 md:p-10">
        <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="h-9 w-9 rounded-lg bg-slate-900 text-white grid place-items-center">
            <Plane className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div className="font-display text-lg font-semibold text-slate-900">
            Opsy<span className="text-blue-600">Jobs</span>
          </div>
        </Link>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="text-xs font-medium uppercase tracking-wider text-blue-600">
                {side === "employer" ? "For Employers" : "For Candidates"}
              </div>
              <h1 className="font-display text-3xl font-semibold text-slate-900 mt-2">{title}</h1>
              {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
