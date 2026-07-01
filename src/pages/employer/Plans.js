import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/constants/roles";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { formatInr } from "@/lib/format";

export default function Plans() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [employer, setEmployer] = useState(null);
  const [sub, setSub] = useState(null);
  const [busyPlan, setBusyPlan] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (user && user.role === "employer") {
      (async () => {
        try {
          const [e, s] = await Promise.all([
            api.get("/api/employers/me"),
            api.get("/api/billing/subscription"),
          ]);
          setEmployer(e.data);
          setSub(s.data);
        } catch {}
      })();
    }
  }, [user, loading]);

  const checkout = async (planId) => {
    if (!user) { nav("/employer/login?next=/employer/plans"); return; }
    if (user.role !== "employer") { toast.error("Only employers can subscribe."); return; }
    if (!employer) { nav("/employer/profile?next=/employer/plans"); return; }
    setBusyPlan(planId);
    try {
      await openRazorpayCheckout({
        plan: planId,
        employer,
        onSuccess: async () => {
          toast.success("Subscription activated!");
          const s = await api.get("/api/billing/subscription");
          setSub(s.data);
          nav("/employer");
        },
        onClose: () => setBusyPlan(null),
      });
    } catch (e) {
      toast.error(e?.response?.data?.detail || e.message || "Payment failed");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="tj-container py-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-xs font-medium uppercase tracking-wider text-blue-600">Pricing</div>
          <h1 className="font-display text-4xl font-semibold mt-2">Plans built for travel agencies</h1>
          <p className="text-slate-600 mt-3">
            All plans include voice-screened applicants, unlimited candidate access during the plan window, and full-time travel roles only.
          </p>
          {sub && (
            <div className="mt-4 inline-block bg-emerald-50 text-emerald-800 text-sm px-3 py-1.5 rounded-full">
              You're on the <b className="capitalize">{sub.plan}</b> plan — {sub.job_posts_used}/{sub.job_posts_allowed} posts used.
            </div>
          )}
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((p) => {
            const isCurrent = sub?.plan === p.id && sub?.status === "active";
            return (
              <div
                key={p.id}
                className={`tj-card p-6 flex flex-col relative ${p.popular ? "ring-2 ring-blue-600 shadow-lift" : ""}`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Most popular
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold">{formatInr(p.priceInr)}</span>
                  <span className="text-sm text-slate-500">/ {p.durationDays} days</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-slate-700 flex-1">
                  <Feature>{p.posts} job posts</Feature>
                  <Feature>Up to {p.cap} applicants per role</Feature>
                  <Feature>Voice-screened candidates</Feature>
                  <Feature>Full-time travel roles only</Feature>
                  {p.rm && <Feature>Dedicated relationship manager</Feature>}
                </ul>
                <Button
                  onClick={() => checkout(p.id)}
                  disabled={busyPlan === p.id || isCurrent}
                  className={`mt-6 h-11 ${p.popular ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-900 hover:bg-slate-800"}`}
                >
                  {isCurrent ? "Current plan" : busyPlan === p.id ? "Opening checkout…" : `Choose ${p.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-slate-500">
          Need a custom enterprise plan? <Link to="/for-employers" className="text-blue-600 hover:underline">Talk to us</Link>.
        </div>
      </div>
    </div>
  );
}

function Feature({ children }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
