import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CandidateSignup() {
  const { signupEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) { toast.error("Please accept the terms to continue."); return; }
    setBusy(true);
    try {
      await signupEmail({ email, password, role: "candidate" });
      toast.success("Account created. Let's set up your profile.");
      nav("/me/profile");
    } catch (e) {
      toast.error(e?.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!consent) { toast.error("Please accept the terms first."); return; }
    setBusy(true);
    try {
      await loginGoogle({ role: "candidate", expectedRole: "candidate" });
      nav("/me/profile");
    } catch (e) {
      if (e.code === "wrong-role") { toast.error(e.message); nav("/employer/login"); }
      else toast.error(e?.message || "Google sign-up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side="candidate" title="Create your candidate account" subtitle="Two minutes. Resume + voice intro stored once, reused everywhere.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span>
            I agree to the <Link to="/terms" className="underline">Terms</Link> and{" "}
            <Link to="/privacy" className="underline">Privacy Policy</Link>, and consent to storing my resume and voice introduction for the purpose of applying to jobs on this platform.
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
        Already have an account?{" "}
        <Link to="/candidate/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Hiring instead?{" "}
        <Link to="/employer/signup" className="text-slate-700 hover:underline">Create an employer account</Link>
      </p>
    </AuthShell>
  );
}
