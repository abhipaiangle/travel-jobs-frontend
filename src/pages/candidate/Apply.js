import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSalary } from "@/lib/format";
import { ROLE_CATEGORIES } from "@/constants/roles";

const roleLabel = (v) => ROLE_CATEGORIES.find((r) => r.value === v)?.label || v;

export default function Apply() {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav(`/candidate/login?next=/jobs/${id}/apply`); return; }
    if (user.role !== "candidate") { nav("/"); return; }
    (async () => {
      try {
        const [j, p] = await Promise.all([
          api.get(`/api/jobs/${id}`),
          api.get("/api/candidates/me"),
        ]);
        setJob(j.data);
        setProfile(p.data);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not load job");
      }
    })();
  }, [id, user, loading, nav]);

  if (!job) {
    return <div className="tj-container py-16 text-slate-500">Loading…</div>;
  }

  const profileReady = profile?.profile_complete;

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!profileReady) {
      nav(`/me/profile?next=/jobs/${id}/apply`);
      return;
    }
    setBusy(true);
    try {
      const custom_answers = (job.custom_questions || []).map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      await api.post("/api/applications", { job_id: id, custom_answers });
      setSubmitted(true);
      toast.success("Application submitted!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Could not apply");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="tj-container py-10 sm:py-16 max-w-xl">
        <div className="tj-card p-6 sm:p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
          <h1 className="font-display text-2xl font-semibold mt-4">Application sent</h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Your profile, resume, and voice intro have been shared with {job.title}'s recruiter.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link to="/me/applications" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-11">Track applications</Button>
            </Link>
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-11">Browse more roles</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24 sm:pb-0">
      <div className="tj-container py-5 sm:py-10 max-w-3xl">
        <Link to={`/jobs/${id}`} className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to job
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold mt-3 leading-tight">
          Apply to {job.title}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{job.city}, {job.state}</span>
          <span className="text-slate-300">·</span>
          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="hidden sm:inline">{roleLabel(job.role_category)}</span>
        </p>

        {!profileReady && (
          <div className="mt-5 sm:mt-6 tj-card p-4 sm:p-5 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-amber-900">Finish your profile first</div>
                <p className="text-sm text-amber-800 mt-1">
                  You need a resume and a voice introduction before applying. It takes about two minutes.
                </p>
                <div className="mt-3">
                  <Link to={`/me/profile?next=/jobs/${id}/apply`}>
                    <Button className="h-11 px-5">Complete profile</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <form id="apply-form" onSubmit={submit} className="mt-5 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="tj-card p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-semibold">Your profile</h2>
            <p className="text-sm text-slate-600 mt-1">
              We'll share your resume, voice intro, and basic details with the recruiter.
            </p>
            {profileReady && (
              <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Resume on file</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Voice intro on file</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> {profile?.full_name} · {profile?.city}</li>
              </ul>
            )}
            <div className="mt-3">
              <Link to="/me/profile" className="text-sm text-blue-600 hover:underline">Edit profile</Link>
            </div>
          </div>

          {job.custom_questions?.length > 0 && (
            <div className="tj-card p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-base sm:text-lg font-semibold">A few questions from the recruiter</h2>
              {job.custom_questions.map((q) => (
                <QuestionField
                  key={q.id}
                  q={q}
                  value={answers[q.id] || ""}
                  onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                />
              ))}
            </div>
          )}

          <div className="hidden sm:flex items-center justify-end">
            <Button type="submit" disabled={busy || !profileReady} className="h-11 px-8 bg-slate-900 hover:bg-slate-800">
              {busy ? "Submitting…" : "Submit application"}
            </Button>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Button
          type="submit"
          form="apply-form"
          disabled={busy || !profileReady}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base"
        >
          {busy ? "Submitting…" : profileReady ? "Submit application" : "Complete profile to apply"}
        </Button>
      </div>
    </div>
  );
}

function QuestionField({ q, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label>{q.label}{q.required && <span className="text-rose-500 ml-0.5">*</span>}</Label>
      {q.type === "textarea" ? (
        <textarea
          required={q.required}
          rows={3}
          className="w-full rounded-md border border-slate-200 p-3 text-base sm:text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : q.type === "number" ? (
        <Input type="number" inputMode="numeric" required={q.required} value={value}
          onChange={(e) => onChange(e.target.value)} className="text-base sm:text-sm h-11" />
      ) : q.type === "single_select" ? (
        <select
          required={q.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-base sm:text-sm"
        >
          <option value="">Select…</option>
          {(q.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <Input required={q.required} value={value} onChange={(e) => onChange(e.target.value)}
          className="text-base sm:text-sm h-11" />
      )}
    </div>
  );
}
