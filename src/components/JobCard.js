import { Link } from "react-router-dom";
import { MapPin, Briefcase, IndianRupee, Plane, GraduationCap } from "lucide-react";
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

export default function JobCard({ job }) {
  const exp = expRange(job.experience_min, job.experience_max);
  return (
    <Link to={`/jobs/${job.job_id}`} className="block group">
      <div className="tj-card tj-card-hover p-4 sm:p-5 active:scale-[0.995] transition-transform">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-slate-100 grid place-items-center shrink-0">
            <Plane className="h-5 w-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                {job.title}
              </h3>
              <span className="tj-tag bg-slate-900 text-white shrink-0 hidden sm:inline-flex">Full-time</span>
            </div>

            <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{job.city}
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5" />{formatSalary(job.salary_min, job.salary_max)}
              </span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />{roleLabel(job.role_category)}
              </span>
              {job.work_mode && (
                <>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{workLabel(job.work_mode)}</span>
                </>
              )}
              {exp && (
                <>
                  <span className="text-slate-300 hidden sm:inline">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" />{exp}
                  </span>
                </>
              )}
            </div>

            <p className="mt-2.5 sm:mt-3 text-sm text-slate-600 line-clamp-2">
              {job.summary || job.description}
            </p>

            <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                <span>{timeAgo(job.created_at)}</span>
                <span className="sm:hidden inline-flex items-center gap-1 text-slate-500">
                  · {workLabel(job.work_mode)}
                </span>
              </div>
              <span className="text-sm font-medium text-blue-600 group-hover:underline shrink-0">
                View →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
