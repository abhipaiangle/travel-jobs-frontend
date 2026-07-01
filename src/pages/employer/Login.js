import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployerLogin() {
  const { loginEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/employer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginEmail({ email, password, expectedRole: "employer" });
      toast.success("Welcome back!");
      nav(next);
    } catch (e) {
      if (e.code === "wrong-role") { toast.error(e.message); nav("/candidate/login"); }
      else toast.error(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await loginGoogle({ role: "employer", expectedRole: "employer" });
      nav(next);
    } catch (e) {
      if (e.code === "wrong-role") { toast.error(e.message); nav("/candidate/login"); }
      else toast.error(e?.message || "Google login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side="employer" title="Employer sign in" subtitle="Manage your jobs, candidates, and subscription.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="recruiter@agency.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy} className="w-full h-11 bg-slate-900 hover:bg-slate-800">
          {busy ? "Signing in…" : "Sign in"}
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
        New employer?{" "}
        <Link to="/employer/signup" className="text-blue-600 font-medium hover:underline">Create an employer account</Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Looking for a job instead?{" "}
        <Link to="/candidate/login" className="text-slate-700 hover:underline">Candidate sign-in</Link>
      </p>
    </AuthShell>
  );
}
