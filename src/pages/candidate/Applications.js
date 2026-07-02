import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin, Briefcase, IndianRupee, Plane, X, AlertCircle, CheckCircle2,
  Mic, Download, History, ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { APPLICATION_STATUS_STYLE, ROLE_CATEGORIES } from "@/constants/roles";
import { formatSalary, timeAgo } from "@/lib/format";
import { ScreeningStep } from "@/components/ApplyModal";

const roleLabel = (v) => ROLE_CATEGORIES.find((r) => r.value === v)?.label || v;

function screeningState(app) {
  const total = app.job?.custom_questions?.length ?? app.total_questions ?? 0;
  const answered = app.answered_count ?? 0;
  return { total, answered, missing: Math.max(0, total - answered) };
}

async function signGet(key) {
  try {
    const r = await api.get(`/api/uploads/sign-get?key=${encodeURIComponent(key)}`);
    return r.data.download_url;
  } catch {
    toast.error("Could not generate download link");
    return null;
  }
}

export default function Applications() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/candidate/login?next=/me/applications"); return; }
    if (user.role !== "candidate") { nav("/"); return; }
    (async () => {
      try {
        const [a, c] = await Promise.all([
          api.get("/api/applications/me"),
          api.get("/api/candidates/me").catch(() => ({ data: null })),
        ]);
        setItems(a.data || []);
        setCandidate(c.data || null);
      } catch {
        setItems([]);
      }
    })();
  }, [user, loading, nav]);

  useEffect(() => {
    if (!items) return;
    const focusId = params.get("app");
    if (!focusId) return;
    const match = items.find((a) => a.application_id === focusId);
    if (match) setOpenId(match.application_id);
  }, [items, params]);

  const active = useMemo(
    () => (openId ? items?.find((a) => a.application_id === openId) : null),
    [items, openId]
  );

  const closeSheet = () => {
    setOpenId(null);
    if (params.get("app")) {
      params.delete("app");
      setParams(params, { replace: true });
    }
  };

  const refresh = async () => {
    try {
      const r = await api.get("/api/applications/me");
      setItems(r.data || []);
    } catch {}
  };

  const onScreeningComplete = async () => {
    await refresh();
    setCompleting(null);
    toast.success("Screening updated");
  };

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

        <div className="mt-5 sm:mt-6 space-y-2.5">
          {items.map((a) => (
            <CompactRow
              key={a.application_id}
              a={a}
              onOpen={() => setOpenId(a.application_id)}
            />
          ))}
        </div>
      </div>

      {active && (
        <ApplicationDetailSheet
          application={active}
          candidate={candidate}
          onClose={closeSheet}
          onComplete={() => setCompleting(active)}
        />
      )}

      {completing && (
        <ScreeningCompletionModal
          application={completing}
          onClose={() => setCompleting(null)}
          onComplete={onScreeningComplete}
        />
      )}
    </div>
  );
}

function CompactRow({ a, onOpen }) {
  const j = a.job || {};
  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
  const { total, answered, missing } = screeningState(a);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left tj-card tj-card-hover p-3.5 sm:p-4 flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center shrink-0">
        <Plane className="h-4.5 w-4.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-slate-900 truncate text-sm sm:text-base">
            {j.title || "Job removed"}
          </h3>
          <span className={`tj-tag ${s.cls} shrink-0 text-[10px]`}>{s.label}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {j.city && <span>{j.city}</span>}
          {j.salary_min != null && (
            <>
              <span className="text-slate-300">·</span>
              <span>{formatSalary(j.salary_min, j.salary_max)}</span>
            </>
          )}
          <span className="text-slate-300">·</span>
          <span>Applied {timeAgo(a.applied_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {total > 0 && (
          missing > 0 ? (
            <span className="tj-tag bg-amber-50 text-amber-700 text-[10px] inline-flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{answered}/{total}
            </span>
          ) : (
            <span className="tj-tag bg-emerald-50 text-emerald-700 text-[10px] inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />{total}/{total}
            </span>
          )
        )}
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </div>
    </button>
  );
}

function ApplicationDetailSheet({ application, candidate, onClose, onComplete }) {
  const a = application;
  const j = a.job || {};
  const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
  const { total, answered, missing } = screeningState(a);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [voiceIntroUrl, setVoiceIntroUrl] = useState(null);
  const [loadingVoice, setLoadingVoice] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const questionLookup = useMemo(() => {
    const src = a.job_snapshot?.custom_questions || j.custom_questions || [];
    return Object.fromEntries(src.map((q) => [q.id, q]));
  }, [a.job_snapshot, j.custom_questions]);

  const orderedQuestions = useMemo(() => {
    const src = a.job_snapshot?.custom_questions || j.custom_questions || [];
    const answerMap = Object.fromEntries((a.custom_answers || []).map((ans) => [ans.question_id, ans]));
    return src.map((q) => ({ question: q, answer: answerMap[q.id] || null }));
  }, [a, j.custom_questions]);

  const playIntro = async () => {
    if (voiceIntroUrl || !candidate?.voice_intro_url) return;
    setLoadingVoice(true);
    const url = await signGet(candidate.voice_intro_url);
    setVoiceIntroUrl(url);
    setLoadingVoice(false);
  };

  const openResume = async () => {
    if (!candidate?.resume_url) return;
    const url = await signGet(candidate.resume_url);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-lg bg-white shadow-lift flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">
              Application
            </div>
            <div className="font-display text-lg font-semibold text-slate-900 truncate mt-0.5">
              {j.title || "Job removed"}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
              {j.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{j.city}</span>}
              {j.salary_min != null && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" />{formatSalary(j.salary_min, j.salary_max)}</span>
                </>
              )}
              {j.role_category && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{roleLabel(j.role_category)}</span>
                </>
              )}
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`tj-tag ${s.cls}`}>{s.label}</span>
            {total > 0 && (
              <span
                className={`tj-tag ${
                  missing > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                } inline-flex items-center gap-1`}
              >
                <CheckCircle2 className="h-3 w-3" />
                Screening {answered}/{total}
              </span>
            )}
            <span className="text-xs text-slate-500 ml-auto">Applied {timeAgo(a.applied_at)}</span>
          </div>

          {missing > 0 && j.job_id && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-amber-900">
                  {missing} question{missing === 1 ? "" : "s"} unanswered
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  Applications with more answers rank higher for the recruiter.
                </div>
              </div>
              <Button
                size="sm"
                onClick={onComplete}
                className="h-9 px-3 bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                Complete
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {j.job_id && (
              <Link to={`/jobs/${j.job_id}`}>
                <Button variant="outline" size="sm" className="h-9">View job</Button>
              </Link>
            )}
            {candidate?.resume_url && (
              <Button variant="outline" size="sm" className="h-9" onClick={openResume}>
                <Download className="h-4 w-4" /> Resume
              </Button>
            )}
          </div>

          {candidate?.voice_intro_url && (
            <section className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Voice introduction
              </div>
              {voiceIntroUrl ? (
                <audio controls src={voiceIntroUrl} className="w-full" />
              ) : (
                <Button variant="outline" size="sm" onClick={playIntro} disabled={loadingVoice}>
                  <Mic className="h-4 w-4" /> {loadingVoice ? "Loading…" : "Load voice intro"}
                </Button>
              )}
            </section>
          )}

          {orderedQuestions.length > 0 && (
            <section className="rounded-lg bg-white border border-slate-200 p-4 space-y-3">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Screening answers
              </div>
              {orderedQuestions.map(({ question, answer }, i) => (
                <ScreeningAnswerRow
                  key={question.id}
                  index={i}
                  question={question}
                  answer={answer}
                  onComplete={onComplete}
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

function ScreeningAnswerRow({ index, question, answer, onComplete }) {
  const [voiceUrl, setVoiceUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const isVoice = (answer?.answer_type === "voice") || question.answer_type === "voice";
  const hasVoice = !!answer?.voice_url;
  const hasText = !!(answer?.answer || "").trim();
  const answered = isVoice ? hasVoice : hasText;

  const load = async () => {
    if (voiceUrl || !answer?.voice_url) return;
    setLoading(true);
    const url = await signGet(answer.voice_url);
    setVoiceUrl(url);
    setLoading(false);
  };

  return (
    <div className="border-t border-slate-100 first:border-t-0 first:pt-0 pt-3">
      <div className="text-slate-500 text-xs mb-1 inline-flex items-center gap-1">
        <span>Q{index + 1}</span>
        {isVoice && <Mic className="h-3 w-3" />}
        {question.required && <span className="text-rose-500">*</span>}
      </div>
      <div className="text-slate-800 text-sm">{question.label}</div>
      <div className="mt-2">
        {answered ? (
          isVoice ? (
            voiceUrl ? (
              <audio controls src={voiceUrl} className="w-full" />
            ) : (
              <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                <Mic className="h-4 w-4" /> {loading ? "Loading…" : "Play voice answer"}
                {answer.duration ? <span className="ml-1 text-slate-500">· {Math.round(answer.duration)}s</span> : null}
              </Button>
            )
          ) : (
            <div className="text-slate-700 whitespace-pre-line text-sm">{answer.answer}</div>
          )
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="text-xs text-amber-700 hover:text-amber-900 inline-flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" /> Not answered — tap to complete
          </button>
        )}
      </div>
    </div>
  );
}

function ScreeningCompletionModal({ application, onClose, onComplete }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const job = application.job || {};

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-xl bg-white sm:rounded-2xl shadow-lift flex flex-col max-h-[100vh] sm:max-h-[90vh] h-[100vh] sm:h-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 pt-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-wider text-blue-600">
                Complete screening
              </div>
              <div className="font-display text-base sm:text-lg font-semibold text-slate-900 truncate mt-0.5">
                {job.title}
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

        <div className="flex-1 overflow-y-auto">
          <ScreeningStep
            job={job}
            application={application}
            initialAnswers={application.custom_answers || []}
            onComplete={onComplete}
            onSkip={onClose}
          />
        </div>
      </div>
    </div>
  );
}
