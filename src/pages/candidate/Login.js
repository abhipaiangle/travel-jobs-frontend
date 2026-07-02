import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import PasswordlessAuth from "@/components/PasswordlessAuth";

export default function CandidateLogin() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/jobs";

  const onSuccess = () => {
    toast.success("Signed in");
    nav(next);
  };

  return (
    <AuthShell side="candidate" title="Sign in" subtitle="Welcome back to OpsyJobs.">
      <PasswordlessAuth
        role="candidate"
        expectedRole="candidate"
        onSuccess={onSuccess}
      />
      <p className="text-sm text-slate-600 mt-6 text-center">
        New here?{" "}
        <Link to="/candidate/signup" className="text-blue-600 font-medium hover:underline">
          Create a candidate account
        </Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Are you a travel agency hiring?{" "}
        <Link to="/employer/login" className="text-slate-700 hover:underline">
          Employer sign-in
        </Link>
      </p>
    </AuthShell>
  );
}
