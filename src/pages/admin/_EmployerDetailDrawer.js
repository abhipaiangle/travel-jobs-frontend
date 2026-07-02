import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Sparkles, Trash2, ShieldCheck, ShieldX, Clock, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROOF_TYPE_LABEL } from "@/constants/kyc";

const PLAN_DEFAULTS = {
  starter: { job_posts_allowed: 2, applicant_cap_per_post: 50, duration_days: 15, visibility_days: 15, rm_support: false },
  growth:  { job_posts_allowed: 6, applicant_cap_per_post: 100, duration_days: 30, visibility_days: 30, rm_support: false },
  pro:     { job_posts_allowed: 10, applicant_cap_per_post: 200, duration_days: 30, visibility_days: 30, rm_support: true },
};

export default function EmployerDetailDrawer({ employer, onClose, onChanged }) {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [grant, setGrant] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!employer) return;
    setTab("profile");
    setProfile({
      company_name: employer.company_name || "",
      contact_name: employer.contact_name || "",
      contact_phone: employer.contact_phone || "",
      city: employer.city || "",
      website: employer.website || "",
      about: employer.about || "",
      verified: !!employer.verified,
    });
    const currentPlan = employer.subscription?.plan || "growth";
    setGrant({
      plan: currentPlan,
      ...PLAN_DEFAULTS[currentPlan],
      note: "",
    });
    setRejectReason("");
    setHistory(null);
  }, [employer]);

  useEffect(() => {
    if (!employer || tab !== "history") return;
    (async () => {
      try {
        const r = await api.get(`/api/admin/employers/${employer.employer_id}/subscriptions`);
        setHistory(r.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not load history");
        setHistory([]);
      }
    })();
  }, [employer, tab]);

  if (!employer || !profile || !grant) return null;

  const savedSub = employer.subscription;

  const applyPlanDefaults = (plan) => {
    setGrant({ plan, ...PLAN_DEFAULTS[plan], note: grant.note });
  };

  const saveProfile = async () => {
    setBusy(true);
    try {
      await api.patch(`/api/admin/employers/${employer.employer_id}`, profile);
      toast.success("Profile saved");
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally { setBusy(false); }
  };

  const grantSub = async () => {
    setBusy(true);
    try {
      await api.post(`/api/admin/employers/${employer.employer_id}/grant-subscription`, {
        plan: grant.plan,
        job_posts_allowed: Number(grant.job_posts_allowed),
        applicant_cap_per_post: Number(grant.applicant_cap_per_post),
        duration_days: Number(grant.duration_days),
        visibility_days: Number(grant.visibility_days),
        rm_support: !!grant.rm_support,
        note: grant.note || null,
      });
      toast.success("Subscription granted");
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Grant failed");
    } finally { setBusy(false); }
  };

  const revokeSub = async () => {
    if (!window.confirm("Revoke the current active subscription?")) return;
    setBusy(true);
    try {
      await api.post(`/api/admin/employers/${employer.employer_id}/revoke-subscription`);
      toast.success("Subscription revoked");
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Revoke failed");
    } finally { setBusy(false); }
  };

  const decideKyc = async (decision) => {
    if (decision === "reject" && !rejectReason.trim()) {
      toast.error("Add a reason so the employer knows what to fix");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/api/admin/employers/${employer.employer_id}/kyc-decision`, {
        decision,
        reason: decision === "reject" ? rejectReason.trim() : null,
      });
      toast.success(decision === "approve" ? "KYC approved — jobs activated" : "KYC rejected");
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "KYC decision failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:max-w-lg bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold truncate">{employer.company_name}</div>
            <div className="text-xs text-slate-500 truncate">{employer.user?.email}</div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm">
            {savedSub ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium capitalize">{savedSub.plan} · {savedSub.status}</div>
                  <div className="text-xs text-slate-600">
                    {savedSub.job_posts_used}/{savedSub.job_posts_allowed} posts used ·
                    {" "}{savedSub.applicant_cap_per_post} applicants/job ·
                    {" "}{savedSub.visibility_days ?? savedSub.duration_days}d visibility
                  </div>
                  {savedSub.end_date && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Ends {new Date(savedSub.end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {savedSub.status === "active" && (
                  <Button variant="outline" size="sm" onClick={revokeSub} disabled={busy}>
                    <Trash2 className="h-4 w-4" /> Revoke
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-slate-500">No subscription — grant one below to enable job posting.</div>
            )}
          </div>
        </div>

        <div className="px-5 mt-4 border-b border-slate-200 flex gap-1 overflow-x-auto">
          {[
            { id: "profile", label: "Profile" },
            { id: "kyc", label: "KYC", badge: kycBadge(employer.kyc_status) },
            { id: "grant", label: "Subscription" },
            { id: "history", label: "History" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${
                tab === t.id ? "border-slate-900 text-slate-900 font-medium" : "border-transparent text-slate-500"
              }`}
            >
              {t.label}{t.badge}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "profile" && (
            <div className="space-y-3">
              <Field label="Company name">
                <Input value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} />
              </Field>
              <Field label="Contact name">
                <Input value={profile.contact_name} onChange={(e) => setProfile({ ...profile, contact_name: e.target.value })} />
              </Field>
              <Field label="Contact phone">
                <Input value={profile.contact_phone} onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })} />
              </Field>
              <Field label="City">
                <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
              </Field>
              <Field label="Website">
                <Input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
              </Field>
              <Field label="About">
                <textarea
                  rows={4}
                  value={profile.about}
                  onChange={(e) => setProfile({ ...profile, about: e.target.value })}
                  className="w-full rounded-md border border-slate-200 p-3 text-sm"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.verified}
                  onChange={(e) => setProfile({ ...profile, verified: e.target.checked })}
                />
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Mark as verified
              </label>
              <div className="pt-2">
                <Button onClick={saveProfile} disabled={busy} className="bg-slate-900 hover:bg-slate-800">
                  {busy ? "Saving…" : "Save profile"}
                </Button>
              </div>
            </div>
          )}

          {tab === "kyc" && (
            <KycReview
              employer={employer}
              busy={busy}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              onDecide={decideKyc}
            />
          )}

          {tab === "history" && (
            <SubscriptionHistory rows={history} />
          )}

          {tab === "grant" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-2 text-xs text-slate-700">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  Grants a new active subscription and marks any prior one expired. All numbers override the plan defaults.
                </div>
              </div>

              <Field label="Plan">
                <select
                  value={grant.plan}
                  onChange={(e) => applyPlanDefaults(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                  <option value="pro">Pro</option>
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Job posts allowed">
                  <Input type="number" min="0" value={grant.job_posts_allowed}
                    onChange={(e) => setGrant({ ...grant, job_posts_allowed: e.target.value })} />
                </Field>
                <Field label="Applicant cap / post">
                  <Input type="number" min="0" value={grant.applicant_cap_per_post}
                    onChange={(e) => setGrant({ ...grant, applicant_cap_per_post: e.target.value })} />
                </Field>
                <Field label="Duration (days)">
                  <Input type="number" min="1" value={grant.duration_days}
                    onChange={(e) => setGrant({ ...grant, duration_days: e.target.value })} />
                </Field>
                <Field label="Visibility (days/job)">
                  <Input type="number" min="1" value={grant.visibility_days}
                    onChange={(e) => setGrant({ ...grant, visibility_days: e.target.value })} />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!grant.rm_support}
                  onChange={(e) => setGrant({ ...grant, rm_support: e.target.checked })}
                />
                RM support
              </label>

              <Field label="Internal note (optional)">
                <Input value={grant.note} onChange={(e) => setGrant({ ...grant, note: e.target.value })}
                  placeholder="e.g. Trial extension, comped for partner event…" />
              </Field>

              <div className="pt-2 flex gap-2">
                <Button onClick={grantSub} disabled={busy} className="bg-slate-900 hover:bg-slate-800">
                  {busy ? "Granting…" : savedSub ? "Replace subscription" : "Grant subscription"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function kycBadge(status) {
  if (!status || status === "not_started") return null;
  const map = {
    submitted: "bg-amber-500",
    approved: "bg-emerald-500",
    rejected: "bg-rose-500",
  };
  return <span className={`ml-1.5 inline-block h-2 w-2 rounded-full align-middle ${map[status] || "bg-slate-300"}`} />;
}

function KycReview({ employer, busy, rejectReason, setRejectReason, onDecide }) {
  const kyc = employer.kyc;
  const status = employer.kyc_status || "not_started";
  if (!kyc || status === "not_started") {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-sm text-slate-500">
        This employer hasn't submitted KYC yet.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border p-3 flex items-start gap-2 text-sm ${
          status === "approved" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
          status === "rejected" ? "bg-rose-50 border-rose-200 text-rose-800" :
          "bg-amber-50 border-amber-200 text-amber-800"
        }`}
      >
        {status === "approved" ? <ShieldCheck className="h-4 w-4 mt-0.5" /> :
         status === "rejected" ? <ShieldX className="h-4 w-4 mt-0.5" /> :
         <Clock className="h-4 w-4 mt-0.5" />}
        <div>
          <div className="font-medium capitalize">{status}</div>
          {kyc.submitted_at && <div className="text-xs opacity-80">Submitted {new Date(kyc.submitted_at).toLocaleString()}</div>}
          {status === "rejected" && kyc.rejection_reason && (
            <div className="text-xs mt-1">Reason: {kyc.rejection_reason}</div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium capitalize">{kyc.type}</span></div>
        {kyc.type === "hellotravel" ? (
          <>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">HelloTravel email</span>
              <span className="font-medium break-all">{kyc.hellotravel_email || "—"}</span>
            </div>
            {kyc.hellotravel_email && (
              <a
                href={`https://iagents.hellotravel.com/admin?email=${encodeURIComponent(kyc.hellotravel_email)}`}
                target="_blank" rel="noreferrer"
                className="text-xs text-blue-600 inline-flex items-center gap-1 pt-1"
              >
                Look up on HelloTravel <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between gap-3"><span className="text-slate-500">Business name</span><span className="font-medium">{kyc.business_name || "—"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">PAN</span><span className="font-medium">{kyc.pan_number || "—"}</span></div>
            <div className="flex justify-between gap-3"><span className="text-slate-500">GST</span><span className="font-medium">{kyc.gst_number || "—"}</span></div>
            {kyc.registered_address && (
              <div>
                <div className="text-slate-500">Registered address</div>
                <div className="text-slate-800 whitespace-pre-line">{kyc.registered_address}</div>
              </div>
            )}
            <div className="grid gap-2 pt-1">
              <ProofLink
                label="Registration proof"
                docType={kyc.registration_proof_type}
                s3Key={kyc.registration_proof_url}
                name={kyc.registration_proof_name}
              />
              <ProofLink
                label="Address proof"
                docType={kyc.address_proof_type}
                s3Key={kyc.address_proof_url}
                name={kyc.address_proof_name}
              />
            </div>
          </>
        )}
      </div>

      {status !== "approved" && (
        <div className="space-y-3">
          <Field label="Rejection reason (needed to reject)">
            <textarea
              rows={2}
              className="w-full rounded-md border border-slate-200 p-2 text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. HelloTravel email doesn't match an active account"
            />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => onDecide("approve")} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {busy ? "Working…" : "Approve KYC"}
            </Button>
            <Button onClick={() => onDecide("reject")} disabled={busy} variant="outline">
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProofLink({ label, docType, s3Key, name }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    if (!s3Key) return;
    setBusy(true);
    try {
      const r = await api.get(`/api/uploads/sign-get?key=${encodeURIComponent(s3Key)}`);
      const url = r.data?.download_url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not load document");
    } finally {
      setBusy(false);
    }
  };
  const typeLabel = docType ? (PROOF_TYPE_LABEL[docType] || docType) : null;
  return (
    <div className="border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-500">{label}</span>
        {s3Key ? (
          <button
            onClick={open}
            disabled={busy}
            className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 max-w-[65%] truncate"
          >
            <span className="truncate">{name || "View document"}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </button>
        ) : (
          <span className="text-slate-400 text-sm">—</span>
        )}
      </div>
      {typeLabel && (
        <div className="text-xs text-slate-500 mt-0.5">Type: <span className="text-slate-800">{typeLabel}</span></div>
      )}
    </div>
  );
}

function SubscriptionHistory({ rows }) {
  if (rows == null) return <div className="text-sm text-slate-500">Loading…</div>;
  if (rows.length === 0) return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 text-center text-sm text-slate-500">
      No subscriptions on record.
    </div>
  );
  return (
    <div className="space-y-3">
      {rows.map((s) => (
        <div key={s.subscription_id} className="rounded-xl bg-white border border-slate-200 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium capitalize">{s.plan}</div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              s.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
            }`}>{s.status}</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            {s.job_posts_used}/{s.job_posts_allowed} posts · {s.applicant_cap_per_post} applicants/job · {s.visibility_days ?? s.duration_days}d visibility
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(s.start_date).toLocaleDateString()}
            {s.end_date ? ` — ${new Date(s.end_date).toLocaleDateString()}` : " — ongoing"}
          </div>
          {s.granted_by_admin && (
            <div className="text-xs text-slate-400 mt-1">Granted by admin{s.note ? ` · ${s.note}` : ""}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
