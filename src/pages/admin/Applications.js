import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminShell from "./_Shell";
import { APPLICATION_STATUS_STYLE, APPLICATION_PIPELINE } from "@/constants/roles";
import { timeAgo } from "@/lib/format";

const ALL_STATUSES = [
  ...APPLICATION_PIPELINE,
  "rejected",
  "withdrawn",
];

export default function AdminApplications() {
  const [rows, setRows] = useState(null);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const params = new URLSearchParams();
      if (jobId) params.set("job_id", jobId);
      if (status) params.set("status", status);
      const r = await api.get(`/api/admin/applications?${params.toString()}`);
      setRows(r.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not load applications");
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const setAppStatus = async (id, s) => {
    setBusyId(id);
    try {
      await api.patch(`/api/admin/applications/${id}`, { status: s, note: "admin override" });
      toast.success(`Moved to ${APPLICATION_STATUS_STYLE[s]?.label || s}`);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally { setBusyId(null); }
  };

  return (
    <AdminShell title="Applications">
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex flex-wrap gap-2 mb-4">
        <Input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Filter by job_id…" className="flex-1 min-w-[200px]" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
          <option value="">Any status</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{APPLICATION_STATUS_STYLE[s]?.label || s}</option>)}
        </select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {rows == null ? (
        <div className="text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-slate-500">No applications.</div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          {rows.map((a) => {
            const s = APPLICATION_STATUS_STYLE[a.status] || APPLICATION_STATUS_STYLE.applied;
            return (
              <div key={a.application_id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)_auto] gap-2 sm:gap-4 items-center px-4 py-3 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.candidate?.full_name || a.candidate_id}</div>
                  <div className="text-xs text-slate-500 truncate">{a.candidate?.city} · {a.candidate?.phone}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate">{a.job?.title || a.job_id}</div>
                  <div className="text-xs text-slate-500">applied {timeAgo(a.applied_at)}</div>
                </div>
                <div>
                  <span className={`tj-tag ${s.cls}`}>{s.label}</span>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {a.answered_count}/{a.total_questions} screening
                  </div>
                </div>
                <select
                  disabled={busyId === a.application_id}
                  value=""
                  onChange={(e) => e.target.value && setAppStatus(a.application_id, e.target.value)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                >
                  <option value="">Move to…</option>
                  {ALL_STATUSES.filter((x) => x !== a.status).map((x) => (
                    <option key={x} value={x}>{APPLICATION_STATUS_STYLE[x]?.label || x}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
