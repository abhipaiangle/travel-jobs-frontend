import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Briefcase, Users, Zap } from "lucide-react";
import { api } from "@/lib/api";
import AdminShell from "./_Shell";

export default function AdminOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/api/admin/summary");
        setData(r.data);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Could not load summary");
      }
    })();
  }, []);

  return (
    <AdminShell title="Overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card icon={Building2} label="Employers" value={data?.employers_total} to="/admin/employers" />
        <Card icon={Zap} label="Active subs" value={data?.subscriptions_active} to="/admin/employers" />
        <Card icon={Briefcase} label="Jobs live" value={data?.jobs_active} to="/admin/jobs" />
        <Card icon={Users} label="Applications" value={data?.applications_total} to="/admin/applications" />
      </div>
      <div className="mt-8 rounded-xl bg-white border border-slate-200 p-5">
        <div className="font-medium">What you can do here</div>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
          <li>Grant / revoke subscriptions for any employer, overriding plan defaults.</li>
          <li>Change job posting caps, applicant caps, and public visibility windows.</li>
          <li>Force-move any application through the pipeline.</li>
        </ul>
      </div>
    </AdminShell>
  );
}

function Card({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-white border border-slate-200 p-4 sm:p-5 flex items-start gap-3 hover:border-slate-400 transition"
    >
      <div className="h-10 w-10 rounded-lg bg-slate-100 grid place-items-center">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="font-display text-2xl font-semibold">
          {value == null ? "—" : value}
        </div>
      </div>
    </Link>
  );
}
