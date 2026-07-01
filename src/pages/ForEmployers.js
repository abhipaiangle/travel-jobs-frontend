import { Link } from "react-router-dom";
import { Mic, ShieldCheck, Sparkles, Check, ArrowRight, Headphones, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/constants/roles";
import { formatInr } from "@/lib/format";

export default function ForEmployers() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 tj-grid-bg opacity-30" />
        <div className="absolute inset-0 tj-hero-gradient" />
        <div className="relative tj-container py-20 md:py-24">
          <div className="max-w-3xl">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">For employers</div>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-tight">
              Hire travel talent. <span className="text-blue-600">In hours, not weeks.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl">
              The only Indian platform exclusively for travel agencies. Subscribe once, post unlimited
              travel-only roles, and listen to voice-screened applicants before scheduling calls.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/employer/signup">
                <Button size="lg" className="h-12 px-6 bg-slate-900 hover:bg-slate-800">
                  Start hiring <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/employer/plans">
                <Button size="lg" variant="outline" className="h-12 px-6">View plans</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="tj-section bg-white">
        <div className="tj-container">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Built for the travel industry</h2>
            <p className="mt-3 text-slate-600">
              Generic job boards waste your time with off-industry applicants. We constrain the marketplace to travel roles only.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Feature icon={Mic} title="Voice-screened candidates" body="Every applicant has a 60-second voice intro. Hear language, energy, and clarity in 60 seconds — not a 30-minute screening call." />
            <Feature icon={ShieldCheck} title="Travel-only marketplace" body="Travel consultants, holiday sales, visa, ops, reservations, and customer support. No software engineers, no gig listings." />
            <Feature icon={Sparkles} title="Subscription wall" body="One subscription unlocks unlimited applicant access during the plan. No per-CV unlock games." />
          </div>
        </div>
      </section>

      <section className="tj-section bg-slate-50">
        <div className="tj-container">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">Plans</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">Simple, transparent pricing</h2>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((p) => (
              <div key={p.id} className={`tj-card p-6 flex flex-col ${p.popular ? "ring-2 ring-blue-600" : ""}`}>
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-semibold">{formatInr(p.priceInr)}</span>
                  <span className="text-sm text-slate-500">/ {p.durationDays} days</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm text-slate-700 flex-1">
                  <Li>{p.posts} job posts</Li>
                  <Li>{p.cap} applicants per role</Li>
                  <Li>Voice-screened candidates</Li>
                  {p.rm && <Li>Dedicated relationship manager</Li>}
                </ul>
                <Link to="/employer/plans" className="mt-6">
                  <Button className="w-full" variant={p.popular ? "default" : "outline"}>Choose {p.name}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tj-section bg-slate-950 text-white">
        <div className="tj-container max-w-3xl text-center">
          <Headphones className="h-10 w-10 text-blue-400 mx-auto" />
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-semibold">Need a custom enterprise plan?</h2>
          <p className="mt-3 text-slate-300">
            Hiring at scale across multiple offices? We'll set you up with a dedicated relationship manager and
            volume pricing.
          </p>
          <a href="mailto:hello@hellotravel.com" className="inline-block mt-6">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
              <Building2 className="h-4 w-4" /> Talk to us
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon: Icon, title, body }) {
  return (
    <div className="tj-card p-6">
      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function Li({ children }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
