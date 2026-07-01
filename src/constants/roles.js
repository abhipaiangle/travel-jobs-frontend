// Travel-only role categories — used by the employer job-post dropdown.
// Keep in sync with backend models.py RoleCategory literal.
export const ROLE_CATEGORIES = [
  { value: "travel_consultant",     label: "Travel Consultant" },
  { value: "holiday_sales_exec",    label: "Holiday Sales Executive" },
  { value: "operations_exec",       label: "Operations Executive" },
  { value: "reservation_exec",      label: "Reservation Executive" },
  { value: "visa_exec",             label: "Visa Executive" },
  { value: "customer_support_exec", label: "Customer Support Executive" },
  { value: "other",                 label: "Other (travel-only)" },
];

export const PLANS = [
  { id: "starter", name: "Starter", priceInr: 2500,  durationDays: 15, posts: 2,  cap: 50  },
  { id: "growth",  name: "Growth",  priceInr: 5000,  durationDays: 30, posts: 6,  cap: 100, popular: true },
  { id: "pro",     name: "Pro",     priceInr: 10000, durationDays: 30, posts: 10, cap: 200, rm: true },
];

// On-screen voice intro script — 45-60s target.
export const VOICE_SCRIPT_LINES = [
  "Hi, I'm [your name].",
  "I've worked in travel for [X years], most recently as [role] at [company].",
  "I'm looking for [type of role] because [reason].",
  "Languages I speak: [languages].",
];

export const INDIAN_CITIES = [
  "Mumbai", "Bengaluru", "Delhi", "Gurugram", "Noida", "Pune", "Hyderabad",
  "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Indore", "Chandigarh",
];

// Full status pipeline — `applied` is the initial state; `withdrawn` is candidate-only.
// Everything else is reachable from the employer's Applicants screen via dropdown.
export const APPLICATION_STATUS_STYLE = {
  applied:             { label: "Applied",             cls: "bg-slate-100 text-slate-700" },
  shortlisted:         { label: "Shortlisted",         cls: "bg-emerald-50 text-emerald-700" },
  interview_scheduled: { label: "Interview scheduled", cls: "bg-sky-50 text-sky-700" },
  interviewed:         { label: "Interviewed",         cls: "bg-indigo-50 text-indigo-700" },
  offered:             { label: "Offered",             cls: "bg-amber-50 text-amber-700" },
  hired:               { label: "Hired",               cls: "bg-green-600 text-white" },
  rejected:            { label: "Rejected",            cls: "bg-rose-50 text-rose-700" },
  withdrawn:           { label: "Withdrawn",           cls: "bg-slate-200 text-slate-600" },
};

// Order shown in pipeline UIs (Shortlisted hub tabs, status dropdown).
export const APPLICATION_PIPELINE = [
  "applied", "shortlisted", "interview_scheduled", "interviewed", "offered", "hired", "rejected",
];

// Statuses an employer can move an application to.
export const EMPLOYER_ASSIGNABLE_STATUSES = [
  "shortlisted", "interview_scheduled", "interviewed", "offered", "hired", "rejected",
];

export const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

export const STANDARD_TRAVEL_LANGUAGES = [
  "English", "Hindi", "Marathi", "Tamil", "Telugu", "Kannada", "Bengali",
  "Gujarati", "Malayalam", "Punjabi",
];
