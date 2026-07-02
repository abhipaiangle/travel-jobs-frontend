import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import PasswordlessAuth from "@/components/PasswordlessAuth";

export default function EmployerLogin() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/employer";

  const onSuccess = () => {
    toast.success("Signed in");
    nav(next);
  };

  return (
    <AuthShell
      side="employer"
      title="Employer sign in"
      subtitle="Manage your jobs, candidates, and subscription."
    >
      <PasswordlessAuth
        role="employer"
        expectedRole="employer"
        methods={["google", "email"]}
        onSuccess={onSuccess}
      />
      <p className="text-sm text-slate-600 mt-6 text-center">
        New employer?{" "}
        <Link to="/employer/signup" className="text-blue-600 font-medium hover:underline">
          Create an employer account
        </Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Looking for a job instead?{" "}
        <Link to="/candidate/login" className="text-slate-700 hover:underline">
          Candidate sign-in
        </Link>
      </p>
    </AuthShell>
  );
}
