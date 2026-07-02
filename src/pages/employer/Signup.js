import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import PasswordlessAuth from "@/components/PasswordlessAuth";

export default function EmployerSignup() {
  const nav = useNavigate();
  const [consent, setConsent] = useState(false);

  const onSuccess = () => {
    toast.success("Account ready. Set up your company profile next.");
    nav("/employer/profile");
  };

  return (
    <AuthShell
      side="employer"
      title="Create employer account"
      subtitle="Post full-time travel-industry roles and reach pre-screened candidates."
    >
      <PasswordlessAuth
        role="employer"
        expectedRole="employer"
        methods={["google", "email"]}
        onSuccess={onSuccess}
        requireConsent
        consentAccepted={consent}
        consent={
          <label className="mb-2 flex items-start gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I confirm I'm hiring on behalf of a legitimate travel-industry business and
              agree to the <Link to="/terms" className="underline">Terms</Link> and{" "}
              <Link to="/privacy" className="underline">Privacy Policy</Link>.
            </span>
          </label>
        }
      />
      <p className="text-sm text-slate-600 mt-6 text-center">
        Already have an employer account?{" "}
        <Link to="/employer/login" className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Looking for a job instead?{" "}
        <Link to="/candidate/signup" className="text-slate-700 hover:underline">
          Candidate sign-up
        </Link>
      </p>
    </AuthShell>
  );
}
