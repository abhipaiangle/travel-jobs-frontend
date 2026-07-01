import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  MapPin, Briefcase, IndianRupee, ArrowLeft, Users, Building2,
  CalendarDays, Clock, GraduationCap, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import ApplyModal from "@/components/ApplyModal";
import { ROLE_CATEGORIES, WORK_MODES } from "@/constants/roles";
import { formatSalary, timeAgo } from "@/lib/format";

const roleLabel = (v) => ROLE_CATEGORIES.find((r) => r.value === v)?.label || v;
const workLabel = (v) => WORK_MODES.find((w) => w.value === v)?.label || v;

function expRange(min, max) {
  if (min == null && max == null) return null;
  if (max == null) return `${min}+ yrs`;
  if (min === max) return `${min} yrs`;
  return `${min ?? 0}–${max} yrs`;
}

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [job, setJob] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/api/jobs/${id}`);
        setJob(r.data);
      } catch {
        toast.error("Job not found");
        nav("/jobs");
      }
    })();
  }, [id, nav]);

  useEffect(() => {
    if (user?.role !== "candidate") { setAlreadyApplied(false); return; }
    (async () => {
      try {
        const r = await api.get("/api/applications/me");
        setAlreadyApplied((r.data || []).some((a) => a.job_id === id));
      } catch {
        setAlreadyApplied(false);
      }
    })();
  }, [id, user]);

  if (!job) return <div className="tj-container py-16 text-slate-500">Loading…</div>;

  const onApply = () => {
    if (user?.role === "employer") {
      toast.error("Employers can't apply. Sign in as a candidate.");
      return;
    }
    if (alreadyApplied) {
      toast.info("You've already applied to this role.");
      nav("/applications");
      return;
    }
    setApplyOpen(true);
  };

  const exp = expRange(job.experience_min, job.experience_max);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] pb-24 sm:pb-0">
      <div className="tj-container py-5 sm:py-10 max-w-4xl">
        <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>

        <div className="mt-4 tj-card p-5 sm:p-8">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-100 grid place-items-center shrink-0">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl sm:text-3xl font-semibold leading-tight">{job.title}</h1>
              {job.summary && (
                <p className="text-slate-600 mt-1.5 text-sm sm:text-base">{job.summary}</p>
              )}

              <div className="mt-3 grid grid-cols-1 sm:flex sm:flex-wrap gap-y-1.5 sm:gap-x-2 sm:gap-y-2 text-sm text-slate-600">
                <Meta icon={MapPin}>{job.city}, {job.state}</Meta>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <Meta icon={IndianRupee}>{formatSalary(job.salary_min, job.salary_max)}/yr</Meta>
                <span className="text-slate-300 hidden sm:inline">·</span>
                <Meta icon={Briefcase}>{roleLabel(job.role_category)}</Meta>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                <span className="tj-tag bg-slate-900 text-white">Full-time</span>
                <span className="tj-tag bg-slate-100 text-slate-700">{workLabel(job.work_mode)}</span>
                {exp && (
                  <span className="tj-tag bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />{exp}
                  </span>
                )}
                {job.openings > 1 && (
                  <span className="tj-tag bg-slate-100 text-slate-700">{job.openings} openings</span>
                )}
                {job.version > 1 && (
                  <span className="tj-tag bg-slate-100 text-slate-700 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />v{job.version}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>Posted {timeAgo(job.created_at)}</span>
                {job.application_deadline && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />Apply by {job.application_deadline.slice(0, 10)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />{job.applicant_count}/{job.applicant_cap} applicants
                </span>
              </div>
            </div>
          </div>

          <hr className="my-6 sm:my-8 border-slate-200" />

          <section>
            <h2 className="font-display text-base sm:text-lg font-semibold mb-2">About this role</h2>
            <div className="text-slate-700 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line">
              {job.description}
            </div>
          </section>

          <BulletSection title="Key responsibilities" items={job.responsibilities} />
          <BulletSection title="Must-have requirements" items={job.requirements} />
          <BulletSection title="Nice to have" items={job.nice_to_have} />
          <BulletSection title="Benefits & perks" items={job.benefits} />

          {job.skills?.length > 0 && (
            <section className="mt-6 sm:mt-8">
              <h2 className="font-display text-base sm:text-lg font-semibold mb-3 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" /> Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span key={s} className="tj-tag bg-blue-50 text-blue-700">{s}</span>
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 sm:mt-10 hidden sm:flex items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200 p-5">
            <div>
              <div className="font-medium">{alreadyApplied ? "You've applied to this role" : "Ready to apply?"}</div>
              <p className="text-sm text-slate-600 mt-0.5">
                {alreadyApplied
                  ? "Track your application status any time."
                  : "Reuse your profile and voice intro — one click after setup."}
              </p>
            </div>
            {alreadyApplied ? (
              <Link to="/applications">
                <Button variant="outline" className="h-11 px-6">View application</Button>
              </Link>
            ) : (
              <Button onClick={onApply} className="h-11 px-6 bg-slate-900 hover:bg-slate-800">Apply now</Button>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 z-30 sm:hidden bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500">Salary</div>
            <div className="text-sm font-semibold text-slate-900 truncate">
              {formatSalary(job.salary_min, job.salary_max)}/yr
            </div>
          </div>
          {alreadyApplied ? (
            <Link to="/applications">
              <Button variant="outline" className="h-11 px-6 shrink-0">View application</Button>
            </Link>
          ) : (
            <Button onClick={onApply} className="h-11 px-6 bg-slate-900 hover:bg-slate-800 shrink-0">
              Apply now
            </Button>
          )}
        </div>
      </div>

      <ApplyModal open={applyOpen} onClose={() => setApplyOpen(false)} job={job} />
    </div>
  );
}

function Meta({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="h-4 w-4 text-slate-400" />{children}
    </span>
  );
}

function BulletSection({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <section className="mt-6 sm:mt-8">
      <h2 className="font-display text-base sm:text-lg font-semibold mb-2">{title}</h2>
      <ul className="space-y-1.5 text-slate-700 text-sm sm:text-[15px] list-disc pl-5">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </section>
  );
}
