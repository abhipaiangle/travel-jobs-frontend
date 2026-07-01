import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VoiceRecorder from "@/components/VoiceRecorder";
import { INDIAN_CITIES, STANDARD_TRAVEL_LANGUAGES } from "@/constants/roles";

const EMPTY = {
  full_name: "",
  phone: "",
  city: "",
  state: "",
  current_role: "",
  total_experience_years: "",
  current_company: "",
  expected_salary: "",
  notice_period: "",
  skills: [],
  languages: [],
  resume_url: "",
  voice_intro_url: "",
  voice_intro_duration: null,
};

export default function CandidateProfile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  const [form, setForm] = useState(EMPTY);
  const [skillInput, setSkillInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/candidate/login"); return; }
    if (user.role !== "candidate") { nav("/"); return; }
    (async () => {
      try {
        const r = await api.get("/api/candidates/me");
        if (r.data) setForm({ ...EMPTY, ...r.data });
      } catch {}
      setLoaded(true);
    })();
  }, [user, loading, nav]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (list, v) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (!form.skills.includes(s)) set("skills", [...form.skills, s]);
    setSkillInput("");
  };

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
        method: "PUT",
        headers: { "Content-Type": "audio/webm" },
        body: blob,
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

  const save = async (e) => {
    e?.preventDefault();
    setBusy(true);
    try {
      const payload = {
        ...form,
        total_experience_years: form.total_experience_years === "" ? null : Number(form.total_experience_years),
        expected_salary: form.expected_salary === "" ? null : Number(form.expected_salary),
      };
      const r = await api.put("/api/candidates/me", payload);
      setForm({ ...EMPTY, ...r.data });
      toast.success("Profile saved");
      if (next && r.data?.profile_complete) nav(next);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) {
    return <div className="tj-container py-16 text-slate-500">Loading…</div>;
  }

  const profileComplete =
    !!form.full_name && !!form.phone && !!form.resume_url && !!form.voice_intro_url;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24 sm:pb-0">
      <div className="tj-container py-5 sm:py-10 max-w-4xl">
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-8">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900">Your profile</h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Fill this once. Apply to any travel role with one click.
            </p>
          </div>
          {profileComplete ? (
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-emerald-50 text-emerald-700 px-2.5 sm:px-3 py-1.5 rounded-full shrink-0">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Profile ready</span>
              <span className="sm:hidden">Ready</span>
            </span>
          ) : (
            <span className="text-xs sm:text-sm bg-amber-50 text-amber-700 px-2.5 sm:px-3 py-1.5 rounded-full shrink-0">
              Incomplete
            </span>
          )}
        </div>

        <form id="profile-form" onSubmit={save} className="space-y-4 sm:space-y-6">
          <div className="tj-card p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-semibold mb-4">Basic details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
              </Field>
              <Field label="Phone" required>
                <Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="+91…" className="h-11 text-base sm:text-sm" />
              </Field>
              <Field label="City" required>
                <select
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-base sm:text-sm"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="State" required>
                <Input value={form.state} onChange={(e) => set("state", e.target.value)} required />
              </Field>
            </div>
          </div>

          <div className="tj-card p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-semibold mb-4">Experience</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Current role">
                <Input value={form.current_role} onChange={(e) => set("current_role", e.target.value)} placeholder="e.g. Travel Consultant" />
              </Field>
              <Field label="Current company">
                <Input value={form.current_company} onChange={(e) => set("current_company", e.target.value)} />
              </Field>
              <Field label="Total experience (years)">
                <Input type="number" min="0" step="0.5" value={form.total_experience_years}
                  onChange={(e) => set("total_experience_years", e.target.value)} />
              </Field>
              <Field label="Expected monthly salary (₹)">
                <Input type="number" min="0" value={form.expected_salary}
                  onChange={(e) => set("expected_salary", e.target.value)} placeholder="e.g. 35000" />
              </Field>
              <Field label="Notice period">
                <Input value={form.notice_period} onChange={(e) => set("notice_period", e.target.value)} placeholder="Immediate / 15 days / 1 month" />
              </Field>
            </div>
          </div>

          <div className="tj-card p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-semibold mb-1">Skills</h2>
            <p className="text-sm text-slate-600 mb-4">Add 3–8 skills relevant to travel roles (GDS, Amadeus, visa, ticketing, etc.).</p>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                placeholder="Type a skill and press Enter"
              />
              <Button type="button" onClick={addSkill} variant="outline">Add</Button>
            </div>
            {form.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("skills", form.skills.filter((x) => x !== s))}
                    className="tj-tag bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {s} ×
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="tj-card p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-semibold mb-1">Languages</h2>
            <p className="text-sm text-slate-600 mb-4">Pick the languages you can converse with customers in.</p>
            <div className="flex flex-wrap gap-2">
              {STANDARD_TRAVEL_LANGUAGES.map((l) => {
                const on = form.languages.includes(l);
                return (
                  <button
                    type="button"
                    key={l}
                    onClick={() => set("languages", toggle(form.languages, l))}
                    className={`tj-tag border ${on ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"}`}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="tj-card p-5 sm:p-6">
            <h2 className="font-display text-base sm:text-lg font-semibold mb-1">Resume</h2>
            <p className="text-sm text-slate-600 mb-4">PDF, up to 5MB. Employers can download this only if you apply to their role.</p>
            {form.resume_url ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <FileText className="h-4 w-4" />
                  Resume on file
                </div>
                <label className="text-sm text-emerald-700 underline cursor-pointer">
                  Replace
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleResume} disabled={uploadingResume} />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 cursor-pointer hover:border-slate-400">
                <Upload className="h-6 w-6 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {uploadingResume ? "Uploading…" : "Click to upload your resume (PDF)"}
                </span>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleResume} disabled={uploadingResume} />
              </label>
            )}
          </div>

          <VoiceRecorder
            onReady={handleVoice}
            uploading={uploadingVoice}
            existingUrl={form.voice_intro_url}
          />

          <div className="hidden sm:flex items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              {profileComplete
                ? "All set — you can now apply with one click."
                : "Resume + voice intro are required to apply to jobs."}
            </p>
            <Button type="submit" disabled={busy} className="h-11 px-6 bg-slate-900 hover:bg-slate-800">
              {busy ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Button
          type="submit"
          form="profile-form"
          disabled={busy}
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-base"
        >
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</Label>
      {children}
    </div>
  );
}
