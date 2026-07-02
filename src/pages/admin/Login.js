import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PasswordlessAuth from "@/components/PasswordlessAuth";

export default function AdminLogin() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/admin";

  const onSuccess = () => {
    toast.success("Signed in");
    nav(next);
  };

  return (
    <div className="min-h-screen bg-slate-900 grid place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 sm:p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <img src="/opsyjobs-logo.svg" alt="OpsyJobs" className="h-9 w-auto" />
          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 border-l border-slate-200 pl-3">
            Admin
          </div>
        </div>
        <PasswordlessAuth
          role="admin"
          expectedRole="admin"
          methods={["email"]}
          onSuccess={onSuccess}
        />
        <p className="text-xs text-slate-500 mt-6">
          Admin accounts are seeded via{" "}
          <code className="bg-slate-100 px-1 rounded">seed_admin.py</code>.
        </p>
      </div>
    </div>
  );
}
