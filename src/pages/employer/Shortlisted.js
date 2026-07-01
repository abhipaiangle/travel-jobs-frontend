import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, MapPin, Phone, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  APPLICATION_STATUS_STYLE,
  EMPLOYER_ASSIGNABLE_STATUSES,
} from "@/constants/roles";
import { timeAgo, formatInr } from "@/lib/format";

const TABS = [
  { value: "in_pipeline",         label: "In pipeline" },
  { value: "shortlisted",         label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interviews" },
  { value: "interviewed",         label: "Interviewed" },
  { value: "offered",             label: "Offered" },
  { value: "hired",               label: "Hired" },
];

export default function Shortlisted() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("in_pipeline");
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/employer/login?next=/employer/shortlisted"); return; }
    if (user.role !== "employer") { nav("/"); return; }
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    setItems(null);
    (async () => {
      try {
        const q = tab === "in_pipeline" ? "" : `?status=${tab}`;
        const r = await api.get(`/api/employer/shortlisted${q}`);
        setItems(r.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not load");
        setItems([]);
      }
    })();
  }, [tab, user]);

  const updateStatus = async (applicationId, status) => {
    try {
      await api.patch(`/api/applications/${applicationId}`, { status });
      setItems((arr) => (arr || []).filter((a) => a.application_id !== applicationId));
      toast.success(`Moved to ${APPLICATION_STATUS_STYLE[status]?.label || status}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not update");
    }
  };

  const counts = useMemo(() => {
    if (!items) return {};
    return items.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
  }, [items]);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-semibold inline-flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" /> Pipeline
            </h1>
            <p className="text-slate-600 mt-1">All candidates you've moved past the initial application stage, across every job.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`tj-tag text-xs px-3 py-1.5 rounded-full transition ${
                tab === t.value
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
              }`}
            >
              {t.label}
              {items && t.value !== "in_pipeline" && counts[t.value] != null && (
                <span className={`ml-1 ${tab === t.value ? "text-slate-300" : "text-slate-400"}`}>· {counts[t.value]}</span>
              )}
            </button>
          ))}
        </div>

        {items === null ? (
          <div className="mt-10 text-slate-500 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="mt-10 tj-card p-10 text-center">
            <h2 className="font-display text-xl font-semibold">Nothing here yet</h2>
            <p className="text-slate-600 mt-2">
              Move candidates into this stage from a job's Applicants screen.
            </p>
            <Link to="/employer" className="inline-block mt-4">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((a) => (
              <PipelineCard
                key={a.application_id}
                a={a}
                onStatus={(s) => updateStatus(a.application_id, s)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineCard({ a, onStatus }) {
  const c = a.candidate || {};
  const j = a.job || {};
  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
  return (
    <div className="tj-card p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="h-11 w-11 rounded-full bg-slate-900 text-white grid place-items-center font-semibold shrink-0">
            {(c.full_name || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-display text-lg font-semibold">{c.full_name || "Candidate"}</div>
              <span className={`tj-tag ${s.cls}`}>{s.label}</span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              → <Link to={`/employer/jobs/${j.job_id}/applicants`} className="hover:text-blue-600">{j.title || "Job"}</Link>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {c.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>}
              {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
              {c.total_experience_years != null && <span>{c.total_experience_years} yrs exp</span>}
              {c.expected_salary && <span>Expects ₹{formatInr(c.expected_salary)}/yr</span>}
              <span>Updated {timeAgo(a.updated_at || a.applied_at)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <select
            value={a.status}
            onChange={(e) => onStatus(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
          >
            <option value={a.status} disabled>
              {APPLICATION_STATUS_STYLE[a.status]?.label || a.status}
            </option>
            {EMPLOYER_ASSIGNABLE_STATUSES.filter((s2) => s2 !== a.status).map((s2) => (
              <option key={s2} value={s2}>
                Move to {APPLICATION_STATUS_STYLE[s2]?.label || s2}
              </option>
            ))}
          </select>
          <Link to={`/employer/jobs/${j.job_id}/applicants`} className="text-xs text-blue-600 inline-flex items-center gap-1 hover:underline">
            Open job <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
