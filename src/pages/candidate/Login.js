import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import AuthShell from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CandidateLogin() {
  const { loginEmail, loginGoogle } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/jobs";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginEmail({ email, password, expectedRole: "candidate" });
      toast.success("Welcome back!");
      nav(next);
    } catch (e) {
      if (e.code === "wrong-role") {
        toast.error(e.message);
        nav("/employer/login");
      } else {
        toast.error(e?.message || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      await loginGoogle({ role: "candidate", expectedRole: "candidate" });
      nav(next);
    } catch (e) {
      if (e.code === "wrong-role") { toast.error(e.message); nav("/employer/login"); }
      else toast.error(e?.message || "Google login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell side="candidate" title="Sign in" subtitle="Welcome back to OpsyJobs.">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="#" className="text-xs text-slate-500 hover:text-slate-900">Forgot?</Link>
          </div>
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
        New here?{" "}
        <Link to="/candidate/signup" className="text-blue-600 font-medium hover:underline">
          Create a candidate account
        </Link>
      </p>
      <p className="text-xs text-slate-500 mt-4 text-center">
        Are you a travel agency hiring?{" "}
        <Link to="/employer/login" className="text-slate-700 hover:underline">Employer sign-in</Link>
      </p>
    </AuthShell>
  );
}
