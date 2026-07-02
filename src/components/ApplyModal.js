import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  X, Mic, Square, RotateCcw, CheckCircle2, ArrowLeft, ArrowRight,
  Upload, FileText, Sparkles, User2, Briefcase,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import PasswordlessAuth from "@/components/PasswordlessAuth";
import { INDIAN_CITIES } from "@/constants/roles";
import { formatSalary } from "@/lib/format";

const STEPS = ["auth", "profile", "screening", "done"];

export default function ApplyModal({ open, onClose, job }) {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState("auth");
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    if (!open) return;
    if (!user) { setStep("auth"); return; }
    if (user.role !== "candidate") {
      toast.error("Sign in as a candidate to apply.");
      onClose?.();
      return;
    }
    (async () => {
      setProfileLoading(true);
      try {
        const r = await api.get("/api/candidates/me");
        setProfile(r.data || null);
      } catch { setProfile(null); }
      setProfileLoading(false);
      setStep("profile");
    })();
  }, [open, user, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const totalQuestions = job?.custom_questions?.length || 0;

  const onAuthComplete = async () => {
    await refreshUser();
  };

  const onProfileComplete = async (freshProfile) => {
    setProfile(freshProfile);
    try {
      const r = await api.post("/api/applications", { job_id: job.job_id, custom_answers: [] });
      setApplication(r.data);
      if (totalQuestions > 0) setStep("screening");
      else setStep("done");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not submit application");
    }
  };

  const onScreeningComplete = () => setStep("done");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-xl bg-white sm:rounded-2xl shadow-lift flex flex-col max-h-[100vh] sm:max-h-[90vh] h-[100vh] sm:h-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <ModalHeader step={step} job={job} onClose={onClose} totalQuestions={totalQuestions} />

        <div className="flex-1 overflow-y-auto">
          {step === "auth" && (
            <AuthStep onComplete={onAuthComplete} job={job} />
          )}
          {step === "profile" && (
            <ProfileStep
              profile={profile}
              loading={profileLoading}
              onComplete={onProfileComplete}
            />
          )}
          {step === "screening" && (
            <ScreeningStep
              job={job}
              application={application}
              onComplete={onScreeningComplete}
              onSkip={onScreeningComplete}
            />
          )}
          {step === "done" && (
            <DoneStep job={job} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

function ModalHeader({ step, job, onClose, totalQuestions }) {
  const label =
    step === "auth" ? "Sign in to apply" :
    step === "profile" ? "Your profile" :
    step === "screening" ? "A few quick questions" :
    "Applied";
  const idx = STEPS.indexOf(step);
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 sm:px-6 pt-4 pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-blue-600">
            Applying to
          </div>
          <div className="font-display text-base sm:text-lg font-semibold text-slate-900 truncate mt-0.5">
            {job.title}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {job.city} · {formatSalary(job.salary_min, job.salary_max)}
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
      <div className="mt-3 flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          if (s === "screening" && totalQuestions === 0) return null;
          const active = i <= idx;
          return (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition ${active ? "bg-blue-600" : "bg-slate-200"}`}
            />
          );
        })}
      </div>
      <div className="text-xs text-slate-500 mt-2">{label}</div>
    </div>
  );
}

// ============================================================
// Step 1: Auth — unified passwordless (Google / Phone / Email)
// ============================================================
function AuthStep({ onComplete, job }) {
  const [consent, setConsent] = useState(false);

  const onSuccess = async () => {
    toast.success("Signed in");
    await onComplete();
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-start gap-2.5 mb-5">
        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm text-slate-700">
          One profile, apply to every travel role. Takes about 2 minutes for {job.title}.
        </div>
      </div>

      <PasswordlessAuth
        role="candidate"
        expectedRole="candidate"
        onSuccess={onSuccess}
        requireConsent
        consentAccepted={consent}
        consent={
          <label className="mb-1 flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the <Link to="/terms" target="_blank" className="underline">Terms</Link> and{" "}
              <Link to="/privacy" target="_blank" className="underline">Privacy Policy</Link>, and
              consent to storing my resume and voice introduction to apply to jobs.
            </span>
          </label>
        }
      />
    </div>
  );
}

// ============================================================
// Step 2: Profile (prefilled or empty) — resume + voice intro
// ============================================================
const EMPTY_PROFILE = {
  full_name: "", email: "", phone: "", city: "", state: "",
  current_role: "", total_experience_years: "",
  expected_salary: "", notice_period: "",
  skills: [], languages: [],
  resume_url: "", voice_intro_url: "", voice_intro_duration: null,
};

function ProfileStep({ profile, loading, onComplete }) {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ ...EMPTY_PROFILE, ...profile, email: profile.email || user?.email || "" });
    } else if (user?.email) {
      setForm((f) => ({ ...f, email: user.email }));
    }
  }, [profile, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Resume must be ≤ 5MB"); return; }
    setUploadingResume(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const r = await api.post(`/api/uploads/resume?ext=${ext}`);
      const { upload_url, key } = r.data;
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });
      set("resume_url", key);
      toast.success("Resume uploaded");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleVoice = async (blob, duration) => {
    setUploadingVoice(true);
    try {
      const r = await api.post(`/api/uploads/voice?ext=webm&content_type=audio/webm`);
      const { upload_url, key } = r.data;
      await fetch(upload_url, {
        method: "PUT", headers: { "Content-Type": "audio/webm" }, body: blob,
      });
      set("voice_intro_url", key);
      set("voice_intro_duration", duration);
      toast.success("Voice intro saved");
    } catch (err) {
      toast.error(err?.message || "Voice upload failed");
    } finally {
      setUploadingVoice(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!form.full_name || !form.email || !form.phone || !form.city || !form.state) {
      toast.error("Please complete the basics."); return;
    }
    if (!form.voice_intro_url) { toast.error("Please record a voice introduction."); return; }
    setBusy(true);
    try {
      const payload = {
        ...form,
        total_experience_years: form.total_experience_years === "" ? null : Number(form.total_experience_years),
        expected_salary: form.expected_salary === "" ? null : Number(form.expected_salary),
      };
      const r = await api.put("/api/candidates/me", payload);
      await onComplete(r.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading your profile…</div>;

  return (
    <form onSubmit={submit} className="p-5 sm:p-6 space-y-5" id="apply-profile-form">
      <ProfileHint profile={profile} />

      <SectionTitle icon={User2}>Basic details</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Full name" required>
          <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required className="h-11 text-base sm:text-sm" />
        </Field>
        <Field label="Email" required>
          <Input type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} required placeholder="you@example.com" className="h-11 text-base sm:text-sm" />
        </Field>
        <Field label="Phone" required>
          <Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="+91…" className="h-11 text-base sm:text-sm" />
        </Field>
        <Field label="City" required>
          <select
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-base sm:text-sm"
            value={form.city} onChange={(e) => set("city", e.target.value)} required
          >
            <option value="">Select…</option>
            {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="State" required>
          <Input value={form.state} onChange={(e) => set("state", e.target.value)} required className="h-11 text-base sm:text-sm" />
        </Field>
      </div>

      <SectionTitle icon={Briefcase}>A little context</SectionTitle>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Current role">
          <Input value={form.current_role} onChange={(e) => set("current_role", e.target.value)} placeholder="e.g. Travel Consultant" className="h-11 text-base sm:text-sm" />
        </Field>
        <Field label="Total exp (years)">
          <Input type="number" min="0" step="0.5" value={form.total_experience_years}
            onChange={(e) => set("total_experience_years", e.target.value)} className="h-11 text-base sm:text-sm" />
        </Field>
        <Field label="Expected monthly salary (₹)">
          <Input type="number" min="0" value={form.expected_salary}
            onChange={(e) => set("expected_salary", e.target.value)} placeholder="e.g. 35000" className="h-11 text-base sm:text-sm" />
        </Field>
        <Field label="Notice period">
          <Input value={form.notice_period} onChange={(e) => set("notice_period", e.target.value)} placeholder="Immediate / 15 days / 1 month" className="h-11 text-base sm:text-sm" />
        </Field>
      </div>

      <ResumeUploader
        resumeUrl={form.resume_url}
        uploading={uploadingResume}
        onFile={handleResume}
      />

      <VoiceIntroField
        existing={form.voice_intro_url}
        uploading={uploadingVoice}
        onReady={handleVoice}
      />

      <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-100 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Button
          type="submit" disabled={busy}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base"
        >
          {busy ? "Submitting…" : "Save profile & submit application"}
        </Button>
      </div>
    </form>
  );
}

function ProfileHint({ profile }) {
  const isFresh = !profile;
  const isPartial = profile && !profile.profile_complete;
  if (isFresh) {
    return (
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-slate-700">
        Quick set-up: employers see your resume + voice intro instead of a cover letter.
      </div>
    );
  }
  if (isPartial) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
        Almost there — a couple of missing details below.
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4" />
      Profile on file. Review and submit — nothing to re-fill.
    </div>
  );
}

function ResumeUploader({ resumeUrl, uploading, onFile }) {
  return (
    <div>
      <SectionTitle icon={FileText}>Resume</SectionTitle>
      {resumeUrl ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            Resume on file
          </div>
          <label className="text-sm text-emerald-700 underline cursor-pointer">
            Replace
            <input type="file" accept="application/pdf" className="hidden" onChange={onFile} disabled={uploading} />
          </label>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-6 cursor-pointer hover:border-slate-400">
          <Upload className="h-6 w-6 text-slate-400" />
          <span className="text-sm text-slate-600">
            {uploading ? "Uploading…" : "Upload resume (PDF, ≤5MB)"}
          </span>
          <input type="file" accept="application/pdf" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      )}
    </div>
  );
}

function VoiceIntroField({ existing, uploading, onReady }) {
  const rec = useVoiceRecorder();
  const ready = rec.state === "stopped" && rec.blob && rec.elapsed >= rec.MIN_SECONDS;
  const tooShort = rec.state === "stopped" && rec.elapsed < rec.MIN_SECONDS;
  const progress = Math.min(100, (rec.elapsed / rec.MAX_SECONDS) * 100);
  const useThis = () => ready && onReady?.(rec.blob, rec.elapsed);

  const [existingUrl, setExistingUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    setExistingUrl(null);
    if (!existing) return;
    (async () => {
      try {
        const r = await api.get(`/api/uploads/sign-get?key=${encodeURIComponent(existing)}`);
        if (alive) setExistingUrl(r.data?.download_url || null);
      } catch { /* ignore — user can still re-record */ }
    })();
    return () => { alive = false; };
  }, [existing]);

  const showExisting = !!existing && rec.state === "idle" && !rec.blob;

  return (
    <div>
      <SectionTitle icon={Mic}>
        Voice intro
        {existing && rec.state === "idle" && (
          <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" /> On file
          </span>
        )}
      </SectionTitle>
      <p className="text-xs text-slate-500 mt-1 mb-2">
        10–60 sec. Introduce yourself, your travel-industry background, and why this role.
      </p>
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
        {showExisting && (
          <div className="mb-3">
            <div className="text-xs text-slate-500 mb-1.5">Your saved intro</div>
            {existingUrl ? (
              <audio controls src={existingUrl} className="w-full" />
            ) : (
              <div className="text-xs text-slate-400">Loading playback…</div>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="font-mono text-2xl tabular-nums font-medium text-slate-900">
            {formatSecs(rec.elapsed)}
            <span className="text-sm text-slate-400 font-sans"> / {formatSecs(rec.MAX_SECONDS)}</span>
          </div>
          <div className="flex items-center gap-2">
            {rec.state !== "recording" ? (
              <Button onClick={rec.start} type="button" className="flex-1 sm:flex-none h-11">
                <Mic className="h-4 w-4" />
                {rec.blob ? "Re-record" : existing ? "Replace recording" : "Record"}
              </Button>
            ) : (
              <Button onClick={rec.stop} type="button" variant="destructive" className="flex-1 sm:flex-none h-11">
                <Square className="h-4 w-4" /> Stop
              </Button>
            )}
            {rec.blob && rec.state === "stopped" && (
              <Button onClick={rec.reset} type="button" variant="ghost" size="icon" aria-label="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all ${rec.state === "recording" ? "bg-rose-500" : "bg-slate-400"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {rec.blobUrl && (<audio controls src={rec.blobUrl} className="w-full mt-3" />)}
        {tooShort && (
          <div className="mt-2 text-xs text-amber-700">
            A bit short — try at least {rec.MIN_SECONDS}s.
          </div>
        )}
        {rec.error && (
          <div className="mt-2 text-xs text-rose-700">Microphone error: {rec.error}</div>
        )}
        {(rec.blob || uploading) && (
          <div className="mt-3">
            <Button
              disabled={!ready || uploading}
              onClick={useThis}
              type="button"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {uploading ? "Saving…" : "Use this recording"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step 3: Screening questions (voice or text, one per screen)
// ============================================================
export function ScreeningStep({ job, application, initialAnswers, onComplete, onSkip }) {
  const questions = job.custom_questions || [];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const prev = new Map((initialAnswers || []).map((a) => [a.question_id, a]));
    return questions.map((q) => {
      const seed = prev.get(q.id) || {};
      return {
        question_id: q.id,
        answer_type: q.answer_type || "text",
        answer: seed.answer || "",
        voice_url: seed.voice_url || "",
        duration: seed.duration ?? null,
      };
    });
  });
  const [busy, setBusy] = useState(false);

  const q = questions[idx];
  const a = answers[idx];
  const total = questions.length;
  const answeredCount = answers.filter((ans) => (ans.answer_type === "voice" ? !!ans.voice_url : !!(ans.answer || "").trim())).length;

  const setAnswer = (patch) =>
    setAnswers((all) => all.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const persist = async (finalAnswers) => {
    if (!application?.application_id) return;
    await api.patch(`/api/applications/${application.application_id}/answers`, {
      custom_answers: finalAnswers,
    });
  };

  const next = async () => {
    if (q.required) {
      const filled = a.answer_type === "voice" ? !!a.voice_url : !!(a.answer || "").trim();
      if (!filled) { toast.error("This question is required."); return; }
    }
    setBusy(true);
    try {
      await persist(answers);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not save answer");
      setBusy(false);
      return;
    }
    if (idx < total - 1) {
      setIdx(idx + 1);
      setBusy(false);
      return;
    }
    toast.success("Answers saved");
    setBusy(false);
    onComplete();
  };

  const skipAll = async () => {
    // Save whatever's answered so far so partial credit still counts.
    try { await persist(answers); } catch {}
    onSkip();
  };

  if (!q) {
    onComplete();
    return null;
  }

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
        <div className="text-sm text-slate-700">
          Applications with more questions answered rank higher for the recruiter.
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Question {idx + 1} of {total} · {answeredCount}/{total} answered
      </div>

      <h3 className="font-display text-lg font-semibold text-slate-900 leading-snug">
        {q.label}
        {q.required && <span className="text-rose-500 ml-1">*</span>}
      </h3>

      {a.answer_type === "voice" ? (
        <VoiceAnswerRecorder
          key={q.id}
          value={a.voice_url}
          onSaved={(url, duration) => setAnswer({ voice_url: url, duration })}
        />
      ) : (
        <textarea
          rows={4}
          value={a.answer}
          onChange={(e) => setAnswer({ answer: e.target.value })}
          placeholder="Type your answer…"
          className="w-full rounded-md border border-slate-200 p-3 text-base sm:text-sm"
        />
      )}

      <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3 bg-white/95 backdrop-blur border-t border-slate-100 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex items-center gap-2">
        {idx > 0 ? (
          <Button
            type="button" variant="ghost"
            onClick={() => setIdx(idx - 1)}
            className="h-11 px-3"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <Button
            type="button" variant="ghost"
            onClick={skipAll}
            className="h-11 px-3 text-slate-500"
          >
            Skip all
          </Button>
        )}
        <Button
          type="button" onClick={next} disabled={busy}
          className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-base"
        >
          {busy ? "Saving…" : idx < total - 1 ? (<>Next <ArrowRight className="h-4 w-4" /></>) : "Finish"}
        </Button>
      </div>
    </div>
  );
}

function VoiceAnswerRecorder({ value, onSaved }) {
  const rec = useVoiceRecorder();
  const [uploading, setUploading] = useState(false);
  const ready = rec.state === "stopped" && rec.blob && rec.elapsed >= 3;

  const saveIt = async () => {
    if (!ready) return;
    setUploading(true);
    try {
      const r = await api.post(`/api/uploads/voice?ext=webm&content_type=audio/webm`);
      const { upload_url, key } = r.data;
      await fetch(upload_url, {
        method: "PUT", headers: { "Content-Type": "audio/webm" }, body: rec.blob,
      });
      onSaved(key, rec.elapsed);
      toast.success("Answer saved");
    } catch (err) {
      toast.error(err?.message || "Upload failed");
    } finally { setUploading(false); }
  };

  const progress = Math.min(100, (rec.elapsed / rec.MAX_SECONDS) * 100);

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
      {value && rec.state === "idle" && (
        <div className="mb-3 inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
          <CheckCircle2 className="h-3 w-3" /> Answer saved — re-record to replace
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="font-mono text-2xl tabular-nums font-medium text-slate-900">
          {formatSecs(rec.elapsed)}
          <span className="text-sm text-slate-400 font-sans"> / {formatSecs(rec.MAX_SECONDS)}</span>
        </div>
        <div className="flex items-center gap-2">
          {rec.state !== "recording" ? (
            <Button onClick={rec.start} type="button" className="flex-1 sm:flex-none h-11">
              <Mic className="h-4 w-4" />
              {rec.blob ? "Re-record" : "Record answer"}
            </Button>
          ) : (
            <Button onClick={rec.stop} type="button" variant="destructive" className="flex-1 sm:flex-none h-11">
              <Square className="h-4 w-4" /> Stop
            </Button>
          )}
          {rec.blob && rec.state === "stopped" && (
            <Button onClick={rec.reset} type="button" variant="ghost" size="icon" aria-label="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full transition-all ${rec.state === "recording" ? "bg-rose-500" : "bg-slate-400"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {rec.blobUrl && (<audio controls src={rec.blobUrl} className="w-full mt-3" />)}
      {rec.error && (<div className="mt-2 text-xs text-rose-700">Mic error: {rec.error}</div>)}
      <div className="mt-3">
        <Button
          disabled={!ready || uploading}
          onClick={saveIt}
          type="button"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {uploading ? "Saving…" : "Save this answer"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Step 4: Done
// ============================================================
function DoneStep({ job, onClose }) {
  return (
    <div className="p-6 sm:p-8 text-center">
      <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 grid place-items-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>
      <h2 className="font-display text-2xl font-semibold mt-4">Application sent</h2>
      <p className="text-slate-600 mt-2 text-sm sm:text-base">
        {job.title}'s recruiter has your profile, resume, and voice intro.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Link to="/me/applications" className="flex-1" onClick={onClose}>
          <Button className="w-full h-11">Track applications</Button>
        </Link>
        <Button variant="outline" className="flex-1 h-11" onClick={onClose}>
          Keep browsing
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// helpers
// ============================================================
function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
      {Icon && <Icon className="h-4 w-4 text-slate-500" />}
      {children}
    </div>
  );
}

function formatSecs(s) {
  const m = Math.floor(s / 60);
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}
