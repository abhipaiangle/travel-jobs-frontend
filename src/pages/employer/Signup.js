import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployerSignup() {
  const { signupEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) { toast.error("Please accept the recruiter terms to continue."); return; }
    setBusy(true);
    try {
      await signupEmail({ email, password, role: "employer" });
      toast.success("Account created. Set up your company profile next.");
      nav("/employer/profile");
    } catch (e) {
      toast.error(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!consent) { toast.error("Please accept the recruiter terms first."); return; }
    setBusy(true);
    try {
      await loginGoogle({ role: "employer", expectedRole: "employer" });
      nav("/employer/profile");
    } catch (e) {
      if (e.code === "wrong-role") { toast.error(e.message); nav("/candidate/login"); }
      else toast.error(e?.message || "Google sign-up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side="employer" title="Create employer account" subtitle="Post full-time travel-industry roles and reach pre-screened candidates.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recruiter@agency.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span>
            I confirm I'm hiring on behalf of a legitimate travel-industry business and agree to the{" "}
            <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </span>
        </label>
        <Button type="submit" disabled={busy} className="w-full h-11 bg-slate-900 hover:bg-slate-800">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px bg-slate-200 flex-1" />
        <span>or</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>
      <Button type="button" variant="outline" className="w-full h-11" onClick={google} disabled={busy}>
        Continue with Google
      </Button>
      <p className="text-sm text-slate-600 mt-6 text-center">
        Already have an employer account?{" "}
        <Link to="/employer/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Looking for a job instead?{" "}
        <Link to="/candidate/signup" className="text-slate-700 hover:underline">Candidate sign-up</Link>
      </p>
    </AuthShell>
  );
}
