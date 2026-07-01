import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Users, Sparkles, Plus, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_STYLE, ROLE_CATEGORIES } from "@/constants/roles";
import { timeAgo } from "@/lib/format";

const roleLabel = (v) => ROLE_CATEGORIES.find((r) => r.value === v)?.label || v;

export default function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/employer/login"); return; }
    if (user.role !== "employer") { nav("/"); return; }
    (async () => {
      try {
        const [d, j] = await Promise.all([
          api.get("/api/employer/dashboard"),
          api.get("/api/employer/jobs"),
        ]);
        setData(d.data);
        setJobs(j.data || []);
      } catch {}
    })();
  }, [user, loading, nav]);

  if (!data) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  const { employer, subscription, stats, recent_applications } = data;

  if (!employer) {
    return (
      <div className="tj-container py-16 max-w-xl">
        <div className="tj-card p-8 text-center">
          <h1 className="font-display text-2xl font-semibold">Set up your company profile</h1>
          <p className="text-slate-600 mt-2">We need a few company details before you can post jobs.</p>
          <div className="mt-6">
            <Link to="/employer/profile?next=/employer"><Button>Set up profile</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSub = subscription?.status === "active";
  const canPost = hasActiveSub && subscription.job_posts_used < subscription.job_posts_allowed;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-semibold">Welcome, {employer.contact_name?.split(" ")[0] || "there"}</h1>
            <p className="text-slate-600 mt-1">{employer.company_name} · {employer.city}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/employer/shortlisted">
              <Button variant="outline">Pipeline</Button>
            </Link>
            <Link to="/employer/profile">
              <Button variant="outline">Edit profile</Button>
            </Link>
            <Link to={canPost ? "/employer/jobs/new" : "/employer/plans"}>
              <Button className="bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4" /> {canPost ? "Post a job" : "Get a plan"}
              </Button>
            </Link>
          </div>
        </div>

        {!hasActiveSub && (
          <div className="mt-6 tj-card p-5 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-medium text-blue-900">You need an active subscription to post jobs.</div>
                <p className="text-sm text-blue-800 mt-0.5">Plans start at ₹2,500 for 15 days, 2 posts.</p>
              </div>
              <Link to="/employer/plans"><Button>View plans</Button></Link>
            </div>
          </div>
        )}

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Briefcase} label="Active jobs" value={stats.active_jobs} />
          <Stat icon={Users} label="Total applications" value={stats.total_applications} />
          <Stat icon={Sparkles} label="Shortlisted" value={stats.shortlisted} to="/employer/shortlisted" />
          <Stat icon={Briefcase}
            label="Plan posts used"
            value={subscription ? `${subscription.job_posts_used}/${subscription.job_posts_allowed}` : "—"} />
        </div>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 tj-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent applications</h2>
              <span className="text-xs text-slate-500">{recent_applications.length} shown</span>
            </div>
            {recent_applications.length === 0 ? (
              <div className="mt-6 text-sm text-slate-500">No applications yet. Once candidates apply, they'll appear here.</div>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {recent_applications.map((a) => {
                  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
                  return (
                    <li key={a.application_id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {a.candidate?.full_name || "Candidate"} → {a.job?.title || "Job"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.candidate?.city} · Applied {timeAgo(a.applied_at)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`tj-tag ${s.cls}`}>{s.label}</span>
                        <Link to={`/employer/jobs/${a.job_id}/applicants`} className="text-blue-600 text-sm hover:underline inline-flex items-center gap-1">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="tj-card p-6">
            <h2 className="font-display text-lg font-semibold">Your jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-slate-500 mt-3">No jobs posted yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {jobs.slice(0, 5).map((j) => (
                  <li key={j.job_id} className="border border-slate-100 rounded-lg p-3 hover:border-slate-300 transition">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/employer/jobs/${j.job_id}/applicants`} className="text-sm font-medium text-slate-900 hover:text-blue-600">
                        {j.title}
                      </Link>
                      <span className="tj-tag bg-slate-100 text-slate-700 text-[10px]">{j.status}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {j.city} · {roleLabel(j.role_category)} · {j.applicant_count}/{j.applicant_cap} applicants
                      {j.version > 1 && <span className="ml-1 text-slate-400">· v{j.version}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <Link to={`/employer/jobs/${j.job_id}/applicants`} className="text-blue-600 hover:underline">View applicants</Link>
                      <Link to={`/employer/jobs/${j.job_id}/edit`} className="text-slate-500 hover:text-slate-900">Edit</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, to }) {
  const body = (
    <>
      <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="font-display text-3xl font-semibold text-slate-900 mt-2">{value}</div>
    </>
  );
  if (to) {
    return (
      <Link to={to} className="tj-card p-5 block hover:border-slate-400 transition">
        {body}
      </Link>
    );
  }
  return <div className="tj-card p-5">{body}</div>;
}
