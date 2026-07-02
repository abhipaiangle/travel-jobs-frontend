import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Sparkles, Mic, Type } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_CATEGORIES, INDIAN_CITIES, WORK_MODES } from "@/constants/roles";

const MAX_QUESTIONS = 3;

const newQuestion = (answerType = "text") => ({
  id: `q_${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  answer_type: answerType,
  type: answerType === "voice" ? "textarea" : "textarea",
  required: false,
  options: [],
});

const linesToArray = (s) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const arrayToLines = (xs) => (Array.isArray(xs) ? xs.join("\n") : "");
const csvToArray = (s) => (s || "").split(",").map((x) => x.trim()).filter(Boolean);

const EMPTY = {
  title: "",
  role_category: "",
  summary: "",
  description: "",
  responsibilities: "",
  requirements: "",
  nice_to_have: "",
  benefits: "",
  skills: "",
  city: "",
  state: "",
  country: "India",
  work_mode: "onsite",
  experience_min: "0",
  experience_max: "",
  openings: "1",
  salary_min: "",
  salary_max: "",
  application_deadline: "",
};

function fromJob(job) {
  if (!job) return EMPTY;
  return {
    title: job.title || "",
    role_category: job.role_category || "",
    summary: job.summary || "",
    description: job.description || "",
    responsibilities: arrayToLines(job.responsibilities),
    requirements: arrayToLines(job.requirements),
    nice_to_have: arrayToLines(job.nice_to_have),
    benefits: arrayToLines(job.benefits),
    skills: (job.skills || []).join(", "),
    city: job.city || "",
    state: job.state || "",
    country: job.country || "India",
    work_mode: job.work_mode || "onsite",
    experience_min: String(job.experience_min ?? 0),
    experience_max: job.experience_max == null ? "" : String(job.experience_max),
    openings: String(job.openings ?? 1),
    salary_min: String(job.salary_min ?? ""),
    salary_max: String(job.salary_max ?? ""),
    application_deadline: job.application_deadline ? job.application_deadline.slice(0, 10) : "",
  };
}

export default function JobForm({ mode = "create", jobId = null }) {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const isEdit = mode === "edit";
  const [form, setForm] = useState(EMPTY);
  const [questions, setQuestions] = useState([]);
  const [job, setJob] = useState(null);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [busy, setBusy] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQBusy, setAiQBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav(`/employer/login?next=/employer/jobs/${jobId ? `${jobId}/edit` : "new"}`); return; }
    if (user.role !== "employer") { nav("/"); return; }
  }, [user, loading, nav, jobId]);

  useEffect(() => {
    if (!isEdit || !jobId) return;
    (async () => {
      try {
        const r = await api.get(`/api/jobs/${jobId}`);
        setJob(r.data);
        setForm(fromJob(r.data));
        setQuestions((r.data.custom_questions || []).map((q) => ({
          id: q.id,
          label: q.label || "",
          answer_type: q.answer_type || "text",
          type: q.type || "textarea",
          required: !!q.required,
          options: q.options || [],
        })));
        setHydrated(true);
      } catch {
        toast.error("Job not found");
        nav("/employer");
      }
    })();
  }, [isEdit, jobId, nav]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setQ = (i, patch) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        role_category: form.role_category,
        summary: form.summary.trim() || null,
        description: form.description.trim(),
        responsibilities: linesToArray(form.responsibilities),
        requirements: linesToArray(form.requirements),
        nice_to_have: linesToArray(form.nice_to_have),
        benefits: linesToArray(form.benefits),
        skills: csvToArray(form.skills),
        city: form.city,
        state: form.state,
        country: form.country || "India",
        work_mode: form.work_mode,
        experience_min: Number(form.experience_min || 0),
        experience_max: form.experience_max === "" ? null : Number(form.experience_max),
        openings: Number(form.openings || 1),
        salary_min: Number(form.salary_min),
        salary_max: Number(form.salary_max),
        application_deadline: form.application_deadline || null,
        custom_questions: questions
          .filter((q) => q.label.trim())
          .slice(0, MAX_QUESTIONS)
          .map((q) => ({
            id: q.id,
            label: q.label.trim(),
            answer_type: q.answer_type === "voice" ? "voice" : "text",
            type: "textarea",
            required: !!q.required,
            options: null,
          })),
      };
      if (payload.salary_min > payload.salary_max) {
        toast.error("Salary min must be ≤ max");
        setBusy(false);
        return;
      }
      if (payload.experience_max != null && payload.experience_min > payload.experience_max) {
        toast.error("Experience min must be ≤ max");
        setBusy(false);
        return;
      }

      if (isEdit) {
        await api.patch(`/api/jobs/${jobId}`, payload);
        toast.success("Job updated");
        nav(`/employer/jobs/${jobId}/applicants`);
      } else {
        const r = await api.post("/api/jobs", payload);
        toast.success(
          r.data?.status === "active" ? "Job posted!" : "Job created — activate it to go live"
        );
        nav(`/employer/jobs/${r.data.job_id}/applicants`);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 402) {
        toast.error(detail || "Subscription required");
        nav("/employer/plans");
      } else {
        toast.error(detail || err.message || "Could not save job");
      }
    } finally {
      setBusy(false);
    }
  };

  const runAiDraft = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast.error("Give a short brief first — e.g. role, city, exp, salary");
      return;
    }
    setAiBusy(true);
    try {
      const r = await api.post("/api/ai/job-draft", { prompt });
      const d = r.data || {};
      setForm((f) => ({
        ...f,
        title: d.title || f.title,
        role_category: d.role_category || f.role_category,
        summary: d.summary || f.summary,
        description: d.description || f.description,
        responsibilities: arrayToLines(d.responsibilities) || f.responsibilities,
        requirements: arrayToLines(d.requirements) || f.requirements,
        nice_to_have: arrayToLines(d.nice_to_have) || f.nice_to_have,
        benefits: arrayToLines(d.benefits) || f.benefits,
        skills: (d.skills || []).join(", ") || f.skills,
        city: d.city || f.city,
        state: d.state || f.state,
        work_mode: d.work_mode || f.work_mode,
        experience_min: d.experience_min != null ? String(d.experience_min) : f.experience_min,
        experience_max: d.experience_max != null ? String(d.experience_max) : f.experience_max,
        openings: d.openings != null ? String(d.openings) : f.openings,
        salary_min: d.salary_min != null ? String(d.salary_min) : f.salary_min,
        salary_max: d.salary_max != null ? String(d.salary_max) : f.salary_max,
      }));
      toast.success("Draft ready — review and edit before posting");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "AI draft failed");
    } finally {
      setAiBusy(false);
    }
  };

  const runAiQuestions = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      toast.error("Add a title or description first");
      return;
    }
    setAiQBusy(true);
    try {
      const r = await api.post("/api/ai/screening-questions", {
        title: form.title,
        description: form.description,
        role_category: form.role_category || null,
        count: MAX_QUESTIONS,
      });
      const items = (r.data?.questions || []).slice(0, MAX_QUESTIONS);
      setQuestions(items.map((q) => ({
        id: `q_${Math.random().toString(36).slice(2, 8)}`,
        label: q.label || "",
        answer_type: q.answer_type === "voice" ? "voice" : "text",
        type: "textarea",
        required: q.required !== false,
        options: [],
      })));
      toast.success(`Suggested ${items.length} questions`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "AI suggestion failed");
    } finally {
      setAiQBusy(false);
    }
  };

  if (!hydrated) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  return (
    <div className="bg-slate-50">
      <div className="tj-container py-10 max-w-3xl">
        <Link to="/employer" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-display text-3xl font-semibold mt-3">
          {isEdit ? "Edit job" : "Post a new role"}
        </h1>
        <p className="text-slate-600 mt-1">
          {isEdit
            ? `Editing v${job?.version ?? 1}. Saving content changes will create a new version — existing applications keep the version they applied against.`
            : "Travel-industry, full-time roles only."}
        </p>

        {!isEdit && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-slate-900">Draft with AI</div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Describe the role in one sentence — we'll pre-fill the form. You can edit anything after.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Input
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Senior outbound holiday sales, Mumbai, 3–5 yrs, ₹6–9L"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={runAiDraft}
                    disabled={aiBusy}
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {aiBusy ? "Drafting…" : "Generate"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-6">
          {/* Basics */}
          <Section title="Basics" subtitle="The headline. Shown on cards, search and the top of the job page.">
            <Field label="Job title" required>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="e.g. Senior Travel Consultant — Outbound" />
            </Field>
            <Field label="One-line summary" hint="A short pitch that appears under the title.">
              <Input value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="What's the role in 8–12 words?" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Role category" required>
                <Select value={form.role_category} onChange={(v) => set("role_category", v)} required>
                  <option value="">Select…</option>
                  {ROLE_CATEGORIES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </Field>
              <Field label="Openings">
                <Input type="number" min="1" value={form.openings} onChange={(e) => set("openings", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Location & mode */}
          <Section title="Location & work mode">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="City" required>
                <Select value={form.city} onChange={(v) => set("city", v)} required>
                  <option value="">Select…</option>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="State" required>
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} required />
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
              </Field>
              <Field label="Work mode">
                <Select value={form.work_mode} onChange={(v) => set("work_mode", v)}>
                  {WORK_MODES.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </Select>
              </Field>
            </div>
          </Section>

          {/* Experience & compensation */}
          <Section title="Experience & compensation">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Experience min (years)">
                <Input type="number" min="0" value={form.experience_min} onChange={(e) => set("experience_min", e.target.value)} />
              </Field>
              <Field label="Experience max (years)" hint="Leave blank for 'open-ended'.">
                <Input type="number" min="0" value={form.experience_max} onChange={(e) => set("experience_max", e.target.value)} />
              </Field>
              <Field label="Salary min (annual, ₹)" required>
                <Input type="number" min="0" required value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} placeholder="300000" />
              </Field>
              <Field label="Salary max (annual, ₹)" required>
                <Input type="number" min="0" required value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} placeholder="500000" />
              </Field>
              <Field label="Application deadline" hint="Optional.">
                <Input type="date" value={form.application_deadline} onChange={(e) => set("application_deadline", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Description */}
          <Section title="About the role" subtitle="Long-form description shown to candidates.">
            <Field label="Description" required>
              <textarea
                required
                rows={6}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full rounded-md border border-slate-200 p-3 text-sm"
                placeholder="What will the person do day-to-day? Team context, customer types, tools, GDS systems used."
              />
            </Field>
            <Field label="Key responsibilities" hint="One per line.">
              <textarea
                rows={5}
                value={form.responsibilities}
                onChange={(e) => set("responsibilities", e.target.value)}
                className="w-full rounded-md border border-slate-200 p-3 text-sm font-mono"
                placeholder={"Convert inbound holiday enquiries into bookings\nCoordinate with DMC partners for confirmations"}
              />
            </Field>
            <Field label="Must-have requirements" hint="One per line.">
              <textarea
                rows={5}
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                className="w-full rounded-md border border-slate-200 p-3 text-sm font-mono"
                placeholder={"2+ years of outbound holiday sales\nHands-on with Amadeus or Galileo"}
              />
            </Field>
            <Field label="Nice-to-have (optional)" hint="One per line.">
              <textarea
                rows={3}
                value={form.nice_to_have}
                onChange={(e) => set("nice_to_have", e.target.value)}
                className="w-full rounded-md border border-slate-200 p-3 text-sm font-mono"
                placeholder={"IATA / TAAI certification"}
              />
            </Field>
            <Field label="Benefits / perks (optional)" hint="One per line.">
              <textarea
                rows={3}
                value={form.benefits}
                onChange={(e) => set("benefits", e.target.value)}
                className="w-full rounded-md border border-slate-200 p-3 text-sm font-mono"
                placeholder={"Annual FAM trip\nHealth insurance for self + spouse"}
              />
            </Field>
            <Field label="Skills" hint="Comma-separated tags.">
              <Input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Amadeus, Outbound Sales, Customer Service" />
            </Field>
          </Section>

          {/* Screening questions */}
          <div className="tj-card p-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold">Screening questions</h2>
                <p className="text-sm text-slate-600">
                  Up to {MAX_QUESTIONS}. Voice questions are answered as a short recording; text as a typed reply.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={runAiQuestions}
                  disabled={aiQBusy}
                  className="text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <Sparkles className="h-4 w-4" /> {aiQBusy ? "Thinking…" : "Suggest with AI"}
                </Button>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {questions.map((q, i) => (
                  <div key={q.id} className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-slate-50">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Question {i + 1}</span>
                          <span className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1">
                            {q.answer_type === "voice" ? (
                              <><Mic className="h-3.5 w-3.5" /> Voice answer</>
                            ) : (
                              <><Type className="h-3.5 w-3.5" /> Text answer</>
                            )}
                          </span>
                        </div>
                        <Input
                          value={q.label}
                          onChange={(e) => setQ(i, { label: e.target.value })}
                          placeholder="e.g. Walk us through how you'd handle an upset customer"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setQ(i, { answer_type: "text" })}
                              className={`px-2.5 py-1.5 rounded inline-flex items-center gap-1 ${q.answer_type === "text" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                            >
                              <Type className="h-3.5 w-3.5" /> Text
                            </button>
                            <button
                              type="button"
                              onClick={() => setQ(i, { answer_type: "voice" })}
                              className={`px-2.5 py-1.5 rounded inline-flex items-center gap-1 ${q.answer_type === "voice" ? "bg-slate-900 text-white" : "text-slate-600"}`}
                            >
                              <Mic className="h-3.5 w-3.5" /> Voice
                            </button>
                          </div>
                          <label className="flex items-center gap-2 text-sm text-slate-700 ml-auto">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => setQ(i, { required: e.target.checked })}
                            />
                            Required
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-600 p-2"
                        aria-label="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuestions((qs) => [...qs, newQuestion("text")])}
                disabled={questions.length >= MAX_QUESTIONS}
              >
                <Plus className="h-4 w-4" /> Add question
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                {questions.length}/{MAX_QUESTIONS} added.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Link to={isEdit ? `/employer/jobs/${jobId}/applicants` : "/employer"}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={busy} className="h-11 px-6 bg-slate-900 hover:bg-slate-800">
              {busy ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save changes" : "Create job post")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="tj-card p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Select({ value, onChange, required, children }) {
  return (
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
    >
      {children}
    </select>
  );
}
