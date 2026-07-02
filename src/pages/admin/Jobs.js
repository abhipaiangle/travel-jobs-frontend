import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminShell from "./_Shell";

const STATUSES = ["active", "closed", "expired", "pending_kyc"];

export default function AdminJobs() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      const r = await api.get(`/api/admin/jobs?${params.toString()}`);
      setRows(r.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not load jobs");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString() : "—";

  const relDays = (iso) => {
    if (!iso) return null;
    const ms = new Date(iso) - new Date();
    const d = Math.round(ms / 86400000);
    if (d < 0) return `expired ${-d}d ago`;
    if (d === 0) return "expires today";
    return `${d}d left`;
  };

  return (
    <AdminShell title="Jobs">
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-wrap gap-2 mb-4">
        <Input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title…" className="flex-1 min-w-[200px]"
        />
        <select
          value={status} onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {rows == null ? (
        <div className="text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-slate-500">No jobs match.</div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          {rows.map((j) => (
            <div key={j.job_id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:gap-4 items-center px-4 py-3 border-b border-slate-100">
              <div className="min-w-0">
                <div className="font-medium truncate">{j.title}</div>
                <div className="text-xs text-slate-500 truncate">{j.employer?.company_name || j.employer_id} · {j.city}</div>
              </div>
              <div className="text-sm">
                <span className={`inline-block h-2 w-2 rounded-full mr-1.5 ${j.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                {j.status}
                <div className="text-xs text-slate-500 mt-0.5">{j.applicant_count}/{j.applicant_cap} applicants</div>
              </div>
              <div className="text-sm">
                <div>Visible until {fmtDate(j.visible_until)}</div>
                <div className="text-xs text-slate-500">{relDays(j.visible_until) || "no window"}</div>
              </div>
              <div className="text-xs text-slate-500">v{j.version} · created {fmtDate(j.created_at)}</div>
              <Button size="sm" variant="outline" onClick={() => setEditing(j)}>Edit</Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <JobEditModal
          job={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </AdminShell>
  );
}

function JobEditModal({ job, onClose, onSaved }) {
  const [status, setStatus] = useState(job.status);
  const [cap, setCap] = useState(String(job.applicant_cap || ""));
  const [extend, setExtend] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {};
      if (status !== job.status) payload.status = status;
      if (cap && Number(cap) !== job.applicant_cap) payload.applicant_cap = Number(cap);
      if (extend) payload.extend_visibility_days = Number(extend);
      if (Object.keys(payload).length === 0) { onClose(); return; }
      await api.patch(`/api/admin/jobs/${job.job_id}`, payload);
      toast.success("Job updated");
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="font-display text-lg font-semibold mb-3">Edit job</div>
        <div className="text-sm text-slate-600 mb-4 truncate">{job.title}</div>

        <div className="space-y-3">
          <div>
            <Label>Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label>Applicant cap</Label>
            <Input type="number" min="0" value={cap} onChange={(e) => setCap(e.target.value)} />
          </div>
          <div>
            <Label>Extend visibility (days)</Label>
            <Input type="number" min="1" placeholder="e.g. 15" value={extend} onChange={(e) => setExtend(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">Adds days on top of current visible_until (or from now if already expired).</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy} className="bg-slate-900 hover:bg-slate-800">
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
