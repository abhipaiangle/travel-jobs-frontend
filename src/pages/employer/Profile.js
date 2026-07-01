import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDIAN_CITIES } from "@/constants/roles";

const EMPTY = {
  company_name: "",
  contact_name: "",
  contact_phone: "",
  city: "",
  website: "",
  about: "",
  declarations_accepted: false,
};

export default function EmployerProfile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/employer/login"); return; }
    if (user.role !== "employer") { nav("/"); return; }
    (async () => {
      try {
        const r = await api.get("/api/employers/me");
        if (r.data) {
          setForm({ ...EMPTY, ...r.data });
          setVerified(!!r.data.verified);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [user, loading, nav]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.declarations_accepted) {
      toast.error("Please confirm the recruiter declaration to continue.");
      return;
    }
    setBusy(true);
    try {
      const r = await api.put("/api/employers/me", form);
      setForm({ ...EMPTY, ...r.data });
      toast.success("Company profile saved");
      if (next) nav(next); else nav("/employer");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-10 max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-semibold">Company profile</h1>
            <p className="text-slate-600 mt-1">Candidates will see this on every role you post.</p>
          </div>
          {verified && (
            <span className="inline-flex items-center gap-1.5 text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="h-4 w-4" /> Verified
            </span>
          )}
        </div>

        <form onSubmit={save} className="space-y-6">
          <div className="tj-card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Company</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company name" required>
                <Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} required />
              </Field>
              <Field label="Office city" required>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {INDIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />
              </Field>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label>About the company</Label>
              <textarea
                rows={4}
                className="w-full rounded-md border border-slate-200 p-3 text-sm"
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
                placeholder="Tell candidates what you do, who your customers are, and what makes the team a good place to work."
              />
            </div>
          </div>

          <div className="tj-card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Recruiter contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Recruiter name" required>
                <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} required />
              </Field>
              <Field label="Recruiter phone" required>
                <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} required placeholder="+91…" />
              </Field>
            </div>
          </div>

          <div className="tj-card p-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.declarations_accepted}
                onChange={(e) => set("declarations_accepted", e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-slate-700">
                I confirm we are a legitimate travel-industry business and will only post full-time travel roles.
                No gig, commission-only, or non-travel roles. We will respond to candidates within reasonable timelines.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={busy} className="h-11 px-6 bg-slate-900 hover:bg-slate-800">
              {busy ? "Saving…" : "Save & continue"}
            </Button>
          </div>
        </form>
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
