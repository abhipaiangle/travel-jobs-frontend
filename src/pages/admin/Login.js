import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
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
        <div className="flex items-center gap-2 mb-6">
          <div className="h-9 w-9 rounded-lg bg-slate-900 grid place-items-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-display text-lg font-semibold">
              Opsy<span className="text-blue-600">Jobs</span> Admin
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              by <img src="/ht-logo.png" alt="HelloTravel" className="h-4 w-auto" />
            </div>
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
