import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Search, Building2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AdminShell from "./_Shell";
import EmployerDetailDrawer from "./_EmployerDetailDrawer";

export default function AdminEmployers() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async (search = "") => {
    try {
      const r = await api.get(`/api/admin/employers${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      setRows(r.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not load employers");
    }
  };

  useEffect(() => { load(); }, []);

  const submit = (e) => { e.preventDefault(); load(q); };

  const refresh = async () => {
    await load(q);
    if (selected) {
      try {
        const r = await api.get(`/api/admin/employers/${selected.employer_id}`);
        setSelected(r.data);
      } catch { /* keep drawer state */ }
    }
  };

  return (
    <AdminShell title="Employers">
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by company, contact or city…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {rows == null ? (
        <div className="text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl bg-white border border-slate-200 p-10 text-center text-slate-500">No employers.</div>
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 px-4 py-2 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-50">
            <div>Company</div><div>Subscription</div><div>Posts</div><div>Jobs</div><div></div>
          </div>
          {rows.map((e) => (
            <button
              key={e.employer_id}
              onClick={() => setSelected(e)}
              className="w-full text-left grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 sm:gap-4 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 items-center"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{e.company_name}</div>
                  <div className="text-xs text-slate-500 truncate">{e.contact_name} · {e.city}</div>
                  {e.user?.email && (
                    <div className="text-xs text-slate-400 truncate">{e.user.email}</div>
                  )}
                </div>
              </div>
              <div className="text-sm">
                {e.subscription ? (
                  <span className="inline-flex items-center gap-1">
                    <span className={`inline-block h-2 w-2 rounded-full ${e.subscription.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                    {e.subscription.plan} · {e.subscription.status}
                  </span>
                ) : (
                  <span className="text-slate-400">No subscription</span>
                )}
                <KycPill status={e.kyc_status} />
              </div>
              <div className="text-sm text-slate-600">
                {e.subscription ? `${e.subscription.job_posts_used}/${e.subscription.job_posts_allowed}` : "—"}
              </div>
              <div className="text-sm text-slate-600">{e.jobs_active}/{e.jobs_total} active</div>
              <ExternalLink className="hidden sm:inline h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <EmployerDetailDrawer
        employer={selected}
        onClose={() => setSelected(null)}
        onChanged={refresh}
      />
    </AdminShell>
  );
}

function KycPill({ status }) {
  if (!status || status === "not_started") return (
    <div className="text-xs text-slate-400 mt-0.5">KYC not started</div>
  );
  const cls = {
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  }[status] || "bg-slate-100 text-slate-600";
  return (
    <div className="mt-0.5">
      <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide ${cls}`}>
        KYC · {status}
      </span>
    </div>
  );
}
