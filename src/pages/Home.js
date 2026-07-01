import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mic, ShieldCheck, Sparkles, Briefcase, Users2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import JobCard from "@/components/JobCard";

export default function Home() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/api/jobs");
        setJobs((r.data || []).slice(0, 6));
      } catch {}
    })();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 tj-grid-bg opacity-40" />
        <div className="absolute inset-0 tj-hero-gradient" />
        <div className="relative tj-container py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Voice-first hiring for India's travel industry
            </div>
            <h1 className="mt-5 font-display text-5xl md:text-6xl font-semibold leading-[1.05] text-slate-900">
              Travel jobs.
              <br />
              <span className="text-blue-600">Heard, not just read.</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              The only Indian job platform built exclusively for travel agencies. Candidates record a 60-second
              voice intro so recruiters hear them before they call.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/jobs">
                <Button size="lg" className="h-12 px-6 bg-slate-900 hover:bg-slate-800">
                  Find a travel job <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/for-employers">
                <Button size="lg" variant="outline" className="h-12 px-6">
                  Hire travel talent
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-xl text-sm">
              <Stat label="Voice screened" value="100%" />
              <Stat label="Roles" value="Travel only" />
              <Stat label="Pricing" value="From ₹2.5K" />
            </div>
          </div>
        </div>
      </section>

      <section className="tj-section bg-white">
        <div className="tj-container">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-medium uppercase tracking-wider text-blue-600">How it works</div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">A two-minute funnel both sides love</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Step n={1} icon={Mic} title="Record once" body="Candidates upload a resume and record a 60-second voice intro. Profile reused everywhere." />
            <Step n={2} icon={ShieldCheck} title="Apply with one click" body="No re-typing. Custom employer questions only when actually needed." />
            <Step n={3} icon={Sparkles} title="Recruiters hear you" body="Employers listen to voice intros before scheduling calls — fewer no-shows, faster hires." />
          </div>
        </div>
      </section>

      <section className="tj-section bg-slate-50">
        <div className="tj-container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-blue-600">Open roles</div>
              <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">Recent travel openings</h2>
            </div>
            <Link to="/jobs" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
              See all roles <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="mt-8 tj-card p-10 text-center text-slate-500">No active roles yet. Check back soon.</div>
          ) : (
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {jobs.map((j) => <JobCard key={j.job_id} job={j} />)}
            </div>
          )}
        </div>
      </section>

      <section className="tj-section bg-slate-950 text-white">
        <div className="tj-container grid md:grid-cols-2 gap-6">
          <CtaCard
            icon={Users2}
            kicker="For candidates"
            title="Land your next travel role"
            body="Free, forever. One profile and one voice intro that's reused across every application."
            cta="Create candidate account"
            to="/candidate/signup"
          />
          <CtaCard
            icon={Briefcase}
            kicker="For employers"
            title="Hire travel talent in hours"
            body="From ₹2,500/15 days. Unlimited candidate access during your plan, voice-screened applicants."
            cta="Start hiring"
            to="/employer/signup"
            accent
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-slate-500 text-xs uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }) {
  return (
    <div className="tj-card p-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-items-center">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-xs uppercase tracking-wider text-slate-500">Step 0{n}</div>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{body}</p>
    </div>
  );
}

function CtaCard({ icon: Icon, kicker, title, body, cta, to, accent }) {
  return (
    <div className={`rounded-2xl p-8 border ${accent ? "bg-blue-600 border-blue-500" : "bg-slate-900 border-slate-800"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
        <Icon className="h-4 w-4" /> {kicker}
      </div>
      <h3 className="mt-3 font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-white/80">{body}</p>
      <Link to={to} className="mt-6 inline-block">
        <Button className="bg-white text-slate-900 hover:bg-slate-100">{cta}</Button>
      </Link>
    </div>
  );
}
