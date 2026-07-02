import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthShell from "@/components/AuthShell";
import PasswordlessAuth from "@/components/PasswordlessAuth";

export default function CandidateSignup() {
  const nav = useNavigate();
  const [consent, setConsent] = useState(false);

  const onSuccess = () => {
    toast.success("You're in. Let's set up your profile.");
    nav("/me/profile");
  };

  return (
    <AuthShell
      side="candidate"
      title="Create your candidate account"
      subtitle="Two minutes. Voice intro stored once, reused everywhere."
    >
      <PasswordlessAuth
        role="candidate"
        expectedRole="candidate"
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
              I agree to the <Link to="/terms" className="underline">Terms</Link> and{" "}
              <Link to="/privacy" className="underline">Privacy Policy</Link>, and consent to
              storing my resume and voice introduction for the purpose of applying to jobs on
              this platform.
            </span>
          </label>
        }
      />
      <p className="text-sm text-slate-600 mt-6 text-center">
        Already have an account?{" "}
        <Link to="/candidate/login" className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Hiring instead?{" "}
        <Link to="/employer/signup" className="text-slate-700 hover:underline">
          Create an employer account
        </Link>
      </p>
    </AuthShell>
  );
}
