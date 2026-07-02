import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, ShieldAlert, Clock, ShieldX } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDIAN_CITIES } from "@/constants/roles";
import { REGISTRATION_PROOF_TYPES, ADDRESS_PROOF_TYPES } from "@/constants/kyc";

const EMPTY = {
  company_name: "",
  contact_name: "",
  contact_phone: "",
  city: "",
  website: "",
  about: "",
  declarations_accepted: false,
};

const EMPTY_KYC = {
  type: "hellotravel",
  hellotravel_email: "",
  business_name: "",
  pan_number: "",
  gst_number: "",
  registered_address: "",
  registration_proof_type: "",
  registration_proof_url: "",
  registration_proof_name: "",
  address_proof_type: "",
  address_proof_url: "",
  address_proof_name: "",
};

export default function EmployerProfile() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  const [tab, setTab] = useState(params.get("tab") === "kyc" ? "kyc" : "company");
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [verified, setVerified] = useState(false);
  const [kycStatus, setKycStatus] = useState("not_started");
  const [kycReason, setKycReason] = useState("");
  const [kyc, setKyc] = useState(EMPTY_KYC);

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
          setKycStatus(r.data.kyc_status || "not_started");
          if (r.data.kyc) {
            setKyc({ ...EMPTY_KYC, ...r.data.kyc });
            setKycReason(r.data.kyc.rejection_reason || "");
          }
        }
      } catch {}
      setLoaded(true);
    })();
  }, [user, loading, nav]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setK = (k, v) => setKyc((f) => ({ ...f, [k]: v }));

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

  const saveKyc = async (e) => {
    e.preventDefault();
    if (kyc.type === "hellotravel" && !kyc.hellotravel_email) {
      toast.error("Enter your HelloTravel account email");
      return;
    }
    if (kyc.type === "self") {
      if (!kyc.business_name || !kyc.pan_number) {
        toast.error("Business name and PAN are required");
        return;
      }
      if (!kyc.registration_proof_type || !kyc.registration_proof_url) {
        toast.error("Pick a Registration proof type and upload the document");
        return;
      }
      if (!kyc.address_proof_type || !kyc.address_proof_url) {
        toast.error("Pick an Address proof type and upload the document");
        return;
      }
    }
    setBusy(true);
    try {
      const body = kyc.type === "hellotravel"
        ? { type: "hellotravel", hellotravel_email: kyc.hellotravel_email }
        : {
            type: "self",
            business_name: kyc.business_name,
            pan_number: kyc.pan_number,
            gst_number: kyc.gst_number || null,
            registered_address: kyc.registered_address || null,
            registration_proof_type: kyc.registration_proof_type,
            registration_proof_url: kyc.registration_proof_url || null,
            registration_proof_name: kyc.registration_proof_name || null,
            address_proof_type: kyc.address_proof_type,
            address_proof_url: kyc.address_proof_url || null,
            address_proof_name: kyc.address_proof_name || null,
          };
      const r = await api.post("/api/employers/me/kyc", body);
      if (r.data) {
        setKycStatus(r.data.kyc_status || "submitted");
        if (r.data.kyc) setKyc({ ...EMPTY_KYC, ...r.data.kyc });
        setKycReason("");
      }
      toast.success("KYC submitted for review");
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-10 max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-6">
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

        <div className="flex gap-1 border-b border-slate-200 mb-6">
          {[
            { id: "company", label: "Company" },
            { id: "kyc", label: "KYC" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm border-b-2 -mb-px ${
                tab === t.id
                  ? "border-slate-900 text-slate-900 font-medium"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
              {t.id === "kyc" && <KycDot status={kycStatus} />}
            </button>
          ))}
        </div>

        {tab === "company" ? (
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
        ) : (
          <KycForm
            status={kycStatus}
            reason={kycReason}
            kyc={kyc}
            setK={setK}
            busy={busy}
            onSubmit={saveKyc}
          />
        )}
      </div>
    </div>
  );
}

function KycDot({ status }) {
  if (status === "approved") return <span className="ml-2 inline-block h-2 w-2 rounded-full bg-emerald-500 align-middle" />;
  if (status === "submitted") return <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />;
  if (status === "rejected") return <span className="ml-2 inline-block h-2 w-2 rounded-full bg-rose-500 align-middle" />;
  return <span className="ml-2 inline-block h-2 w-2 rounded-full bg-slate-300 align-middle" />;
}

function KycBanner({ status, reason }) {
  if (status === "approved") {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-emerald-800">KYC approved</div>
          <div className="text-emerald-700">Your jobs are live and visible to candidates.</div>
        </div>
      </div>
    );
  }
  if (status === "submitted") {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-amber-800">KYC under review</div>
          <div className="text-amber-700">We usually approve within one business day. Any jobs you post now stay on hold until approval.</div>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
        <ShieldX className="h-5 w-5 text-rose-600 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium text-rose-800">KYC needs an update</div>
          <div className="text-rose-700">{reason || "Please recheck your details and resubmit."}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
      <ShieldAlert className="h-5 w-5 text-slate-500 mt-0.5" />
      <div className="text-sm">
        <div className="font-medium text-slate-800">KYC required</div>
        <div className="text-slate-600">Complete KYC so your job posts can go live.</div>
      </div>
    </div>
  );
}

function KycForm({ status, reason, kyc, setK, busy, onSubmit }) {
  const readonly = status === "submitted" || status === "approved";
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <KycBanner status={status} reason={reason} />

      <div className="tj-card p-6">
        <h2 className="font-display text-lg font-semibold mb-1">How would you like to verify?</h2>
        <p className="text-sm text-slate-500 mb-4">
          If you already have a HelloTravel account, we can auto-verify using that email.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <ChoiceCard
            selected={kyc.type === "hellotravel"}
            onClick={() => !readonly && setK("type", "hellotravel")}
            title="Use HelloTravel KYC"
            hint="Fastest — admin cross-checks with your HelloTravel account."
          />
          <ChoiceCard
            selected={kyc.type === "self"}
            onClick={() => !readonly && setK("type", "self")}
            title="Submit business documents"
            hint="Share PAN / GST and a company certificate."
          />
        </div>
      </div>

      {kyc.type === "hellotravel" ? (
        <div className="tj-card p-6">
          <h3 className="font-display text-base font-semibold mb-3">HelloTravel account email</h3>
          <Field label="Email you use on HelloTravel" required>
            <Input
              type="email"
              value={kyc.hellotravel_email || ""}
              onChange={(e) => setK("hellotravel_email", e.target.value)}
              placeholder="you@company.com"
              disabled={readonly}
              required
            />
          </Field>
          <p className="text-xs text-slate-500 mt-2">
            The admin team will match this against your HelloTravel account and approve your KYC.
          </p>
        </div>
      ) : (
        <div className="tj-card p-6 space-y-4">
          <h3 className="font-display text-base font-semibold">Business details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Registered business name" required>
              <Input value={kyc.business_name || ""} onChange={(e) => setK("business_name", e.target.value)} disabled={readonly} required />
            </Field>
            <Field label="PAN number" required>
              <Input value={kyc.pan_number || ""} onChange={(e) => setK("pan_number", e.target.value.toUpperCase())} disabled={readonly} required />
            </Field>
            <Field label="GST number">
              <Input value={kyc.gst_number || ""} onChange={(e) => setK("gst_number", e.target.value.toUpperCase())} disabled={readonly} />
            </Field>
          </div>
          <Field label="Registered address">
            <textarea
              rows={3}
              className="w-full rounded-md border border-slate-200 p-3 text-sm disabled:bg-slate-50"
              value={kyc.registered_address || ""}
              onChange={(e) => setK("registered_address", e.target.value)}
              disabled={readonly}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <ProofUpload
              label="Registration proof"
              required
              disabled={readonly}
              typeKey="registration_proof_type"
              typeOptions={REGISTRATION_PROOF_TYPES}
              urlKey="registration_proof_url"
              nameKey="registration_proof_name"
              kyc={kyc}
              setK={setK}
            />
            <ProofUpload
              label="Address proof"
              required
              disabled={readonly}
              typeKey="address_proof_type"
              typeOptions={ADDRESS_PROOF_TYPES}
              urlKey="address_proof_url"
              nameKey="address_proof_name"
              kyc={kyc}
              setK={setK}
            />
          </div>
        </div>
      )}

      {!readonly && (
        <div className="flex items-center justify-end">
          <Button type="submit" disabled={busy} className="h-11 px-6 bg-slate-900 hover:bg-slate-800">
            {busy ? "Submitting…" : status === "rejected" ? "Resubmit KYC" : "Submit KYC"}
          </Button>
        </div>
      )}
    </form>
  );
}

function ProofUpload({ label, required, disabled, typeKey, typeOptions, urlKey, nameKey, kyc, setK }) {
  const [uploading, setUploading] = useState(false);
  const currentType = kyc[typeKey] || "";
  const currentKey = kyc[urlKey];
  const currentName = kyc[nameKey];

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const ct = file.type || "application/pdf";
      const r = await api.post(
        `/api/uploads/kyc?ext=${encodeURIComponent(ext)}&content_type=${encodeURIComponent(ct)}`
      );
      const { upload_url, key } = r.data;
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": ct },
        body: file,
      });
      setK(urlKey, key);
      setK(nameKey, file.name);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-rose-500 ml-0.5">*</span>}</Label>
      <select
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-50"
        value={currentType}
        onChange={(e) => setK(typeKey, e.target.value)}
        disabled={disabled}
        required={required}
      >
        <option value="">Select document type…</option>
        {typeOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <div className="rounded-md border border-slate-200 p-3">
        {currentKey ? (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{currentName || "Uploaded document"}</div>
              <div className="text-xs text-emerald-700 mt-0.5">Uploaded</div>
            </div>
            {!disabled && (
              <label className="text-xs text-blue-600 hover:underline cursor-pointer shrink-0">
                Replace
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/*"
                  onChange={onPick}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        ) : (
          <label className={`flex items-center justify-center gap-2 py-3 text-sm text-slate-600 ${disabled ? "" : "cursor-pointer hover:text-slate-900"}`}>
            {uploading ? "Uploading…" : "Click to upload (PDF / image, ≤ 8 MB)"}
            <input
              type="file"
              className="hidden"
              accept="application/pdf,image/*"
              onChange={onPick}
              disabled={disabled || uploading}
            />
          </label>
        )}
      </div>
    </div>
  );
}

function ChoiceCard({ selected, onClick, title, hint }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition ${
        selected
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className={`font-medium ${selected ? "text-white" : "text-slate-900"}`}>{title}</div>
      <div className={`text-xs mt-1 ${selected ? "text-slate-300" : "text-slate-500"}`}>{hint}</div>
    </button>
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
