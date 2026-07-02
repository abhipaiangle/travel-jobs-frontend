import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, Download, MapPin, Phone, Pencil, History, Mic, CheckCircle2,
  X, ChevronRight, AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import PostActivationBanner from "@/components/PostActivationBanner";
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
  const [params, setParams] = useSearchParams();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [filter, setFilter] = useState(ALL_FILTER);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/employer/login"); return; }
    if (user.role !== "employer") { nav("/"); return; }
    (async () => {
      try {
        const [j, a, d] = await Promise.all([
          api.get(`/api/jobs/${jobId}`),
          api.get(`/api/jobs/${jobId}/applicants`),
          api.get("/api/employer/dashboard"),
        ]);
        setJob(j.data);
        setApps(a.data || []);
        setDashboard(d.data || null);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not load applicants");
        nav("/employer");
      }
    })();
  }, [jobId, user, loading, nav]);

  useEffect(() => {
    if (!apps) return;
    const focus = params.get("app");
    if (focus && apps.some((a) => a.application_id === focus)) setOpenId(focus);
  }, [apps, params]);

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

  const active = useMemo(
    () => (openId ? apps?.find((a) => a.application_id === openId) : null),
    [apps, openId]
  );

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

  const openDetail = (id) => {
    setOpenId(id);
    params.set("app", id);
    setParams(params, { replace: true });
  };

  const closeDetail = () => {
    setOpenId(null);
    if (params.get("app")) {
      params.delete("app");
      setParams(params, { replace: true });
    }
  };

  if (!apps) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  const hasActiveSub = dashboard?.subscription?.status === "active";
  const kycStatus = dashboard?.employer?.kyc_status || "not_started";
  const jobOnHold = job?.status === "pending_kyc";

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      {jobOnHold && (
        <PostActivationBanner
          hasActiveSub={hasActiveSub}
          kycStatus={kycStatus}
          scope="job"
        />
      )}
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
          <div className="mt-6 space-y-2.5">
            {filtered.map((a) => (
              <ApplicantRow
                key={a.application_id}
                a={a}
                job={job}
                onOpen={() => openDetail(a.application_id)}
                onStatus={(s) => updateStatus(a.application_id, s)}
                onOpenResume={openResume}
              />
            ))}
          </div>
        )}
      </div>

      {active && (
        <ApplicantDetailSheet
          application={active}
          job={job}
          onClose={closeDetail}
          onStatus={(s) => updateStatus(active.application_id, s)}
          onOpenResume={openResume}
          onSignGet={signGet}
        />
      )}
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

function screeningRatio(a) {
  const total = a.total_questions ?? 0;
  const answered = a.answered_count ?? 0;
  return { total, answered, ratio: total ? answered / total : 0 };
}

function ratioClass(ratio) {
  if (ratio >= 0.99) return "bg-emerald-50 text-emerald-700";
  if (ratio >= 0.5) return "bg-blue-50 text-blue-700";
  if (ratio > 0) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

function ApplicantRow({ a, job, onOpen, onStatus, onOpenResume }) {
  const c = a.candidate || {};
  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
  const { total, answered, ratio } = screeningRatio(a);
  const ratioPct = Math.round(ratio * 100);

  const handleContainerClick = (e) => {
    // Clicks inside interactive children (resume, select) shouldn't open the sheet.
    if (e.target.closest("[data-stop]")) return;
    onOpen();
  };

  return (
    <div
      onClick={handleContainerClick}
      className="tj-card tj-card-hover p-3.5 sm:p-4 cursor-pointer flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-full bg-slate-900 text-white grid place-items-center font-semibold text-sm shrink-0">
        {(c.full_name || "?")[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="font-medium text-slate-900 truncate text-sm sm:text-base">
            {c.full_name || "Candidate"}
          </div>
          <span className={`tj-tag ${s.cls} shrink-0 text-[10px]`}>{s.label}</span>
          {total > 0 && (
            <span className={`tj-tag ${ratioClass(ratio)} text-[10px] inline-flex items-center gap-1`}>
              <CheckCircle2 className="h-3 w-3" />
              {answered}/{total} · {ratioPct}%
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {c.current_role && (
            <span className="truncate">
              {c.current_role}{c.current_company ? ` · ${c.current_company}` : ""}
            </span>
          )}
          {c.city && (
            <>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>
            </>
          )}
          {c.total_experience_years != null && (
            <>
              <span className="text-slate-300">·</span>
              <span>{c.total_experience_years} yrs</span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span>Applied {timeAgo(a.applied_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0" data-stop onClick={(e) => e.stopPropagation()}>
        {c.resume_url && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 hidden sm:inline-flex"
            onClick={() => onOpenResume(c.resume_url)}
          >
            <Download className="h-4 w-4" /> Resume
          </Button>
        )}
        <select
          value={a.status}
          onChange={(e) => onStatus(e.target.value)}
          className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm max-w-[10rem]"
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
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </div>
    </div>
  );
}

function ApplicantDetailSheet({ application, job, onClose, onStatus, onOpenResume, onSignGet }) {
  const a = application;
  const c = a.candidate || {};
  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
  const { total, answered, ratio } = screeningRatio(a);
  const ratioPct = Math.round(ratio * 100);
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const questionLookup = useMemo(() => {
    const src = a.job_snapshot?.custom_questions || job?.custom_questions || [];
    return Object.fromEntries(src.map((q) => [q.id, q]));
  }, [a.job_snapshot, job]);

  const playVoice = async () => {
    if (voiceUrl || !c.voice_intro_url) return;
    setLoadingVoice(true);
    const url = await onSignGet(c.voice_intro_url);
    setVoiceUrl(url);
    setLoadingVoice(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-xl bg-white shadow-lift flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-11 w-11 rounded-full bg-slate-900 text-white grid place-items-center font-semibold shrink-0">
                {(c.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-display text-lg font-semibold text-slate-900 truncate">
                  {c.full_name || "Candidate"}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span className={`tj-tag ${s.cls} text-[10px]`}>{s.label}</span>
                  {total > 0 && (
                    <span className={`tj-tag ${ratioClass(ratio)} text-[10px] inline-flex items-center gap-1`}>
                      <CheckCircle2 className="h-3 w-3" />
                      {answered}/{total} · {ratioPct}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <section className="grid grid-cols-1 gap-y-1.5 text-sm">
            {c.current_role && (
              <div className="text-slate-700">
                {c.current_role}{c.current_company ? ` · ${c.current_company}` : ""}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              {c.city && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>
              )}
              {c.phone && (
                <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
              )}
              <span>Applied {timeAgo(a.applied_at)}</span>
              {c.notice_period && <span>Notice: {c.notice_period}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              {c.total_experience_years != null && <span>{c.total_experience_years} yrs experience</span>}
              {c.expected_salary && <span>Expects ₹{formatInr(c.expected_salary)}/yr</span>}
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-2">
            {c.resume_url && (
              <Button variant="outline" size="sm" onClick={() => onOpenResume(c.resume_url)}>
                <Download className="h-4 w-4" /> Resume
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-slate-500">Status</label>
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
          </section>

          {(c.skills?.length > 0 || c.languages?.length > 0) && (
            <section className="flex flex-wrap gap-1.5">
              {c.skills?.map((sk) => <span key={sk} className="tj-tag bg-slate-100 text-slate-700">{sk}</span>)}
              {c.languages?.map((l) => <span key={l} className="tj-tag bg-blue-50 text-blue-700">{l}</span>)}
            </section>
          )}

          {c.voice_intro_url && (
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Voice introduction
              </div>
              {voiceUrl ? (
                <audio controls src={voiceUrl} className="w-full" />
              ) : (
                <Button variant="outline" size="sm" onClick={playVoice} disabled={loadingVoice}>
                  <Mic className="h-4 w-4" /> {loadingVoice ? "Loading…" : "Load voice intro"}
                </Button>
              )}
            </section>
          )}

          {a.custom_answers?.length > 0 && (
            <section className="rounded-lg bg-white border border-slate-200 p-4 space-y-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Screening answers
              </div>
              {a.custom_answers.map((ans, i) => (
                <ScreeningAnswerRow
                  key={ans.question_id || i}
                  index={i}
                  question={questionLookup[ans.question_id]}
                  answer={ans}
                  onSignGet={onSignGet}
                />
              ))}
            </section>
          )}

          {a.status_history?.length > 0 && (
            <section>
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
            </section>
          )}
        </div>
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
      <div className="text-slate-800 text-sm">{label}</div>
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
            <span className="text-slate-400 text-xs inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Not answered
            </span>
          )
        ) : answer.answer ? (
          <div className="text-slate-700 whitespace-pre-line text-sm">{answer.answer}</div>
        ) : (
          <span className="text-slate-400 text-xs inline-flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Not answered
          </span>
        )}
      </div>
    </div>
  );
}
