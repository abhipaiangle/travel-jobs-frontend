import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Briefcase, IndianRupee, Plane } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_STYLE, ROLE_CATEGORIES } from "@/constants/roles";
import { formatSalary, timeAgo } from "@/lib/format";

const roleLabel = (v) => ROLE_CATEGORIES.find((r) => r.value === v)?.label || v;

export default function Applications() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/candidate/login?next=/me/applications"); return; }
    if (user.role !== "candidate") { nav("/"); return; }
    (async () => {
      try {
        const r = await api.get("/api/applications/me");
        setItems(r.data || []);
      } catch {
        setItems([]);
      }
    })();
  }, [user, loading, nav]);

  if (items === null) {
    return <div className="tj-container py-16 text-slate-500">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="tj-container py-10 sm:py-16 max-w-xl">
        <div className="tj-card p-8 sm:p-10 text-center">
          <h1 className="font-display text-xl sm:text-2xl font-semibold">No applications yet</h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Once you apply to a role, you can track its status here.
          </p>
          <div className="mt-6">
            <Link to="/jobs"><Button className="h-11 px-6">Browse jobs</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-5 sm:py-10 max-w-4xl">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">Your applications</h1>
        <p className="text-slate-600 mt-1 text-sm sm:text-base">
          {items.length} application{items.length === 1 ? "" : "s"} tracked.
        </p>

        <div className="mt-5 sm:mt-6 space-y-3">
          {items.map((a) => {
            const j = a.job || {};
            const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
            const versionMismatch = a.job_version && j.version && a.job_version !== j.version;
            return (
              <Link
                key={a.application_id}
                to={j.job_id ? `/jobs/${j.job_id}` : "#"}
                className="block tj-card tj-card-hover p-4 sm:p-5"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 grid place-items-center shrink-0">
                    <Plane className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 line-clamp-2">
                        {j.title || "Job removed"}
                      </h3>
                      <span className={`tj-tag ${s.cls} shrink-0`}>{s.label}</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                      {j.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />{j.city}
                        </span>
                      )}
                      {j.salary_min != null && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5" />{formatSalary(j.salary_min, j.salary_max)}
                          </span>
                        </>
                      )}
                      {j.role_category && (
                        <>
                          <span className="text-slate-300 hidden sm:inline">·</span>
                          <span className="hidden sm:inline-flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />{roleLabel(j.role_category)}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>Applied {timeAgo(a.applied_at)}</span>
                      {versionMismatch && (
                        <span className="tj-tag bg-amber-50 text-amber-700 text-[10px]">
                          v{a.job_version} · updated to v{j.version}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
