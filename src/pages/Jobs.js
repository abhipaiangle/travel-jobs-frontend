import { useEffect, useMemo, useState } from "react";
import { Search, MapPin, Briefcase, X, SlidersHorizontal, Check } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import JobCard from "@/components/JobCard";
import { ROLE_CATEGORIES, INDIAN_CITIES } from "@/constants/roles";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (city) params.set("city", city);
        if (role) params.set("role_category", role);
        const r = await api.get(`/api/jobs${params.toString() ? `?${params}` : ""}`);
        setJobs(r.data || []);
      } catch {}
      setLoading(false);
    })();
  }, [city, role]);

  useEffect(() => {
    if (!sheetOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = orig; };
  }, [sheetOpen]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return jobs;
    return jobs.filter((j) =>
      (j.title || "").toLowerCase().includes(term) ||
      (j.description || "").toLowerCase().includes(term) ||
      (j.city || "").toLowerCase().includes(term)
    );
  }, [jobs, q]);

  const reset = () => { setQ(""); setCity(""); setRole(""); };
  const activeFilterCount = (city ? 1 : 0) + (role ? 1 : 0);
  const hasFilter = q || city || role;

  const roleLabel = ROLE_CATEGORIES.find((r) => r.value === role)?.label;

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">
      <div className="border-b border-slate-200 bg-white">
        <div className="tj-container py-5 sm:py-8">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Travel jobs in India</h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1">
            Full-time, salaried roles. No gig listings.
          </p>

          <div className="mt-4 sm:mt-5 flex gap-2 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Title, keyword, city…"
                className="pl-9 h-11 text-base sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 h-11 px-3.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 shrink-0 relative"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {(city || role) && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 lg:hidden">
              {city && (
                <FilterPill onClear={() => setCity("")}>{city}</FilterPill>
              )}
              {role && roleLabel && (
                <FilterPill onClear={() => setRole("")}>{roleLabel}</FilterPill>
              )}
              {hasFilter && (
                <button
                  onClick={reset}
                  className="text-xs text-slate-500 hover:text-slate-900 ml-1"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
          {hasFilter && !(city || role) && (
            <button
              onClick={reset}
              className="hidden lg:inline-flex text-sm text-slate-500 hover:text-slate-900 mt-3"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      <div className="tj-container py-6 sm:py-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
        <aside className="hidden lg:block space-y-6">
          <FilterBlock icon={MapPin} label="City">
            <RadioList
              value={city}
              onChange={setCity}
              options={[{ value: "", label: "All cities" }, ...INDIAN_CITIES.map((c) => ({ value: c, label: c }))]}
            />
          </FilterBlock>
          <FilterBlock icon={Briefcase} label="Role category">
            <RadioList
              value={role}
              onChange={setRole}
              options={[{ value: "", label: "All roles" }, ...ROLE_CATEGORIES.map((r) => ({ value: r.value, label: r.label }))]}
            />
          </FilterBlock>
        </aside>

        <div>
          <div className="text-sm text-slate-500 mb-3 sm:mb-4">
            {loading ? "Loading…" : `${filtered.length} role${filtered.length === 1 ? "" : "s"}`}
          </div>
          {!loading && filtered.length === 0 ? (
            <div className="tj-card p-8 sm:p-10 text-center">
              <h3 className="font-display text-lg font-semibold">No matching roles</h3>
              <p className="text-slate-600 mt-1 text-sm">Try clearing filters or a different keyword.</p>
              {hasFilter && (
                <Button onClick={reset} variant="outline" className="mt-4">Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filtered.map((j) => <JobCard key={j.job_id} job={j} />)}
            </div>
          )}
        </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        city={city}
        setCity={setCity}
        role={role}
        setRole={setRole}
        onClear={reset}
        resultCount={filtered.length}
        loading={loading}
      />
    </div>
  );
}

function FilterPill({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-white text-xs pl-3 pr-1.5 py-1">
      {children}
      <button onClick={onClear} className="h-4 w-4 rounded-full hover:bg-slate-700 grid place-items-center" aria-label="Remove">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function FilterBlock({ icon: Icon, label, children }) {
  return (
    <div className="tj-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 mb-3">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      {children}
    </div>
  );
}

function RadioList({ value, onChange, options }) {
  return (
    <ul className="space-y-1.5 max-h-72 overflow-auto pr-1">
      {options.map((o) => (
        <li key={o.value}>
          <button
            type="button"
            onClick={() => onChange(o.value)}
            className={`w-full text-left text-sm rounded-md px-2 py-1.5 transition ${
              value === o.value ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {o.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

function FilterSheet({ open, onClose, city, setCity, role, setRole, onClear, resultCount, loading }) {
  const [section, setSection] = useState("city");

  if (!open) return null;

  const cityOptions = [{ value: "", label: "All cities" }, ...INDIAN_CITIES.map((c) => ({ value: c, label: c }))];
  const roleOptions = [{ value: "", label: "All roles" }, ...ROLE_CATEGORIES.map((r) => ({ value: r.value, label: r.label }))];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-lift flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div>
            <div className="font-display text-lg font-semibold">Filters</div>
            <div className="text-xs text-slate-500 mt-0.5">Narrow down to roles that fit.</div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center"
            aria-label="Close filters"
          >
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="grid grid-cols-[140px_1fr] flex-1 min-h-0">
          <div className="border-r border-slate-100 bg-slate-50/60 overflow-y-auto py-2">
            <SheetTab
              icon={MapPin}
              label="City"
              active={section === "city"}
              activeValue={city}
              onClick={() => setSection("city")}
            />
            <SheetTab
              icon={Briefcase}
              label="Role"
              active={section === "role"}
              activeValue={ROLE_CATEGORIES.find((r) => r.value === role)?.label}
              onClick={() => setSection("role")}
            />
          </div>

          <div className="overflow-y-auto py-2">
            {section === "city" && (
              <SheetOptions
                value={city}
                onChange={setCity}
                options={cityOptions}
              />
            )}
            {section === "role" && (
              <SheetOptions
                value={role}
                onChange={setRole}
                options={roleOptions}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-3 border-t border-slate-100 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <button
            onClick={onClear}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Clear all
          </button>
          <Button
            onClick={onClose}
            className="flex-1 h-11 bg-slate-900 hover:bg-slate-800"
          >
            {loading ? "Loading…" : `Show ${resultCount} role${resultCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SheetTab({ icon: Icon, label, active, activeValue, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-2.5 border-l-2 transition ${
        active
          ? "border-blue-600 bg-white"
          : "border-transparent hover:bg-white/60"
      }`}
    >
      <Icon className={`h-4 w-4 mt-0.5 ${active ? "text-blue-600" : "text-slate-500"}`} />
      <div className="min-w-0">
        <div className={`text-sm ${active ? "font-medium text-slate-900" : "text-slate-700"}`}>{label}</div>
        {activeValue && (
          <div className="text-[11px] text-slate-500 truncate">{activeValue}</div>
        )}
      </div>
    </button>
  );
}

function SheetOptions({ value, onChange, options }) {
  return (
    <ul>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <li key={o.value}>
            <button
              onClick={() => onChange(o.value)}
              className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between gap-2 ${
                on ? "bg-blue-50 text-blue-700 font-medium" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="truncate">{o.label}</span>
              {on && <Check className="h-4 w-4 shrink-0" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
