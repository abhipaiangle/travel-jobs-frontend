import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Download, MapPin, Phone, Pencil, History, Mic, CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  APPLICATION_STATUS_STYLE,
  EMPLOYER_ASSIGNABLE_STATUSES,
  APPLICATION_PIPELINE,
} from "@/constants/roles";
import { timeAgo, formatInr } from "@/lib/format";

const ALL_FILTER = "all";

export default function Applicants() {
  const { jobId } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState(null);
  const [filter, setFilter] = useState(ALL_FILTER);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/employer/login"); return; }
    if (user.role !== "employer") { nav("/"); return; }
    (async () => {
      try {
        const [j, a] = await Promise.all([
          api.get(`/api/jobs/${jobId}`),
          api.get(`/api/jobs/${jobId}/applicants`),
        ]);
        setJob(j.data);
        setApps(a.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not load applicants");
        nav("/employer");
      }
    })();
  }, [jobId, user, loading, nav]);

  const counts = useMemo(() => {
    const c = { [ALL_FILTER]: apps?.length || 0 };
    APPLICATION_PIPELINE.forEach((s) => { c[s] = 0; });
    (apps || []).forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }, [apps]);

  const filtered = useMemo(() => {
    if (!apps) return [];
    if (filter === ALL_FILTER) return apps;
    return apps.filter((a) => a.status === filter);
  }, [apps, filter]);

  const updateStatus = async (applicationId, status) => {
    try {
      const r = await api.patch(`/api/applications/${applicationId}`, { status });
      setApps((arr) => arr.map((a) =>
        a.application_id === applicationId
          ? { ...a, status, status_history: r.data.status_history || a.status_history }
          : a
      ));
      toast.success(`Moved to ${APPLICATION_STATUS_STYLE[status]?.label || status}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not update");
    }
  };

  const signGet = async (key) => {
    try {
      const r = await api.get(`/api/uploads/sign-get?key=${encodeURIComponent(key)}`);
      return r.data.download_url;
    } catch {
      toast.error("Could not generate download link");
      return null;
    }
  };

  const openResume = async (key) => {
    const url = await signGet(key);
    if (url) window.open(url, "_blank", "noopener");
  };

  if (!apps) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-10">
        <Link to="/employer" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl font-semibold">{job?.title}</h1>
            <p className="text-slate-600 mt-1">
              {job?.city}, {job?.state} · {apps.length} applicants ({job?.applicant_count}/{job?.applicant_cap} cap)
              {job?.version > 1 && <span className="ml-2 text-slate-400">· v{job.version}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to={`/jobs/${jobId}`}>
              <Button variant="outline" size="sm">View public page</Button>
            </Link>
            <Link to={`/employer/jobs/${jobId}/edit`}>
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                <Pencil className="h-4 w-4" /> Edit job
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          <FilterPill label="All" count={counts[ALL_FILTER]} active={filter === ALL_FILTER} onClick={() => setFilter(ALL_FILTER)} />
          {APPLICATION_PIPELINE.map((s) => (
            <FilterPill
              key={s}
              label={APPLICATION_STATUS_STYLE[s].label}
              count={counts[s] || 0}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 tj-card p-10 text-center">
            <h2 className="font-display text-xl font-semibold">
              {filter === ALL_FILTER ? "No applicants yet" : `No one in ${APPLICATION_STATUS_STYLE[filter]?.label || filter}`}
            </h2>
            <p className="text-slate-600 mt-2">
              {filter === ALL_FILTER
                ? "As candidates apply, they'll appear here with voice introductions you can play immediately."
                : "Move someone into this stage from another tab."}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((a) => (
              <ApplicantCard
                key={a.application_id}
                a={a}
                job={job}
                onStatus={(s) => updateStatus(a.application_id, s)}
                onOpenResume={openResume}
                onSignGet={signGet}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScreeningAnswerRow({ index, question, answer, onSignGet }) {
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const label = question?.label || `Question ${index + 1}`;
  const isVoice = answer.answer_type === "voice" || !!answer.voice_url;

  const load = async () => {
    if (voiceUrl || !answer.voice_url) return;
    setLoading(true);
    const url = await onSignGet(answer.voice_url);
    setVoiceUrl(url);
    setLoading(false);
  };

  return (
    <div className="border-t border-slate-100 first:border-t-0 first:pt-0 pt-3">
      <div className="text-slate-500 text-xs mb-1 inline-flex items-center gap-1">
        <span>Q{index + 1}</span>
        {isVoice && <Mic className="h-3 w-3" />}
      </div>
      <div className="text-slate-800">{label}</div>
      <div className="mt-2">
        {isVoice ? (
          answer.voice_url ? (
            voiceUrl ? (
              <audio controls src={voiceUrl} className="w-full" />
            ) : (
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <Mic className="h-4 w-4" /> {loading ? "Loading…" : "Play voice answer"}
                {answer.duration ? <span className="ml-1 text-slate-500">· {Math.round(answer.duration)}s</span> : null}
              </Button>
            )
          ) : (
            <span className="text-slate-400 text-xs">Not answered</span>
          )
        ) : answer.answer ? (
          <div className="text-slate-700 whitespace-pre-line">{answer.answer}</div>
        ) : (
          <span className="text-slate-400 text-xs">Not answered</span>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tj-tag text-xs px-3 py-1.5 rounded-full transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200 text-slate-700 hover:border-slate-400"
      }`}
    >
      {label} <span className={active ? "text-slate-300" : "text-slate-400"}>· {count}</span>
    </button>
  );
}

function ApplicantCard({ a, job, onStatus, onOpenResume, onSignGet }) {
  const c = a.candidate || {};
  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const questionLookup = useMemo(() => {
    const src =
      a.job_snapshot?.custom_questions ||
      job?.custom_questions ||
      [];
    return Object.fromEntries(src.map((q) => [q.id, q]));
  }, [a.job_snapshot, job]);

  const total = a.total_questions ?? Object.keys(questionLookup).length;
  const answered = a.answered_count ?? 0;
  const ratio = a.answered_ratio ?? (total ? answered / total : 0);
  const ratioPct = Math.round(ratio * 100);
  const ratioCls =
    ratio >= 0.99 ? "bg-emerald-50 text-emerald-700" :
    ratio >= 0.5 ? "bg-blue-50 text-blue-700" :
    ratio > 0 ? "bg-amber-50 text-amber-700" :
    "bg-slate-100 text-slate-500";

  const playVoice = async () => {
    if (voiceUrl || !c.voice_intro_url) return;
    setLoadingVoice(true);
    const url = await onSignGet(c.voice_intro_url);
    setVoiceUrl(url);
    setLoadingVoice(false);
  };

  const snapshotMismatch = a.job_snapshot && a.job_snapshot.version != null && false; // reserved
  // For now we just show "Applied vs current" only via job.version vs a.job_version when relevant.

  return (
    <div className="tj-card p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="h-12 w-12 rounded-full bg-slate-900 text-white grid place-items-center font-semibold text-lg shrink-0">
            {(c.full_name || "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-display text-lg font-semibold">{c.full_name || "Candidate"}</div>
              <span className={`tj-tag ${s.cls}`}>{s.label}</span>
              {total > 0 && (
                <span className={`tj-tag ${ratioCls} inline-flex items-center gap-1`}>
                  <CheckCircle2 className="h-3 w-3" />
                  Screening {answered}/{total} · {ratioPct}%
                </span>
              )}
              {a.job_version && a.job_version !== a.current_job_version && a.current_job_version != null && (
                <span className="tj-tag bg-amber-50 text-amber-700 text-[10px]">applied v{a.job_version}</span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {c.current_role && <span>{c.current_role}{c.current_company ? ` · ${c.current_company}` : ""}</span>}
              {c.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.city}</span>}
              {c.total_experience_years != null && <span>{c.total_experience_years} yrs exp</span>}
              {c.expected_salary && <span>Expects ₹{formatInr(c.expected_salary)}/yr</span>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {c.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
              <span>Applied {timeAgo(a.applied_at)}</span>
              {c.notice_period && <span>Notice: {c.notice_period}</span>}
            </div>
            {(c.skills?.length > 0 || c.languages?.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.skills?.map((sk) => <span key={sk} className="tj-tag bg-slate-100 text-slate-700">{sk}</span>)}
                {c.languages?.map((l) => <span key={l} className="tj-tag bg-blue-50 text-blue-700">{l}</span>)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {c.resume_url && (
            <Button variant="outline" size="sm" onClick={() => onOpenResume(c.resume_url)}>
              <Download className="h-4 w-4" /> Resume
            </Button>
          )}
          <label className="text-xs text-slate-500 mt-1">Status</label>
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
        </div>
      </div>

      {c.voice_intro_url && (
        <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Voice introduction</div>
          {voiceUrl ? (
            <audio controls src={voiceUrl} className="w-full" />
          ) : (
            <Button variant="outline" size="sm" onClick={playVoice} disabled={loadingVoice}>
              {loadingVoice ? "Loading…" : "Load voice intro"}
            </Button>
          )}
        </div>
      )}

      {a.custom_answers?.length > 0 && (
        <div className="mt-4 rounded-lg bg-white border border-slate-200 p-3 sm:p-4 text-sm space-y-3">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Screening answers</div>
          {a.custom_answers.map((ans, i) => {
            const q = questionLookup[ans.question_id];
            return (
              <ScreeningAnswerRow
                key={ans.question_id || i}
                index={i}
                question={q}
                answer={ans}
                onSignGet={onSignGet}
              />
            );
          })}
        </div>
      )}

      {a.status_history?.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            className="text-xs text-slate-500 inline-flex items-center gap-1 hover:text-slate-900"
          >
            <History className="h-3.5 w-3.5" /> {historyOpen ? "Hide" : "Show"} status history ({a.status_history.length})
          </button>
          {historyOpen && (
            <ol className="mt-2 border-l border-slate-200 pl-3 space-y-1.5 text-xs text-slate-600">
              {a.status_history.map((h, i) => (
                <li key={i}>
                  <span className={`tj-tag ${APPLICATION_STATUS_STYLE[h.status]?.cls || "bg-slate-100 text-slate-700"} text-[10px] mr-1.5`}>
                    {APPLICATION_STATUS_STYLE[h.status]?.label || h.status}
                  </span>
                  {timeAgo(h.at)}
                  {h.note && <span className="ml-1 text-slate-500">— {h.note}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
