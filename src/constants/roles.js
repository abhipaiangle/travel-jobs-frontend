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
  { id: "growth",  name: "Growth",  priceInr: 5000,  durationDays: 30, posts: 6,  cap: 100 },
  { id: "pro",     name: "Pro",     priceInr: 10000, durationDays: 30, posts: 10, cap: 200, rm: true },
];

// On-screen voice intro script — 45-60s target.
export const VOICE_SCRIPT_LINES = [
  "Hi, I'm [your name].",
  "I've worked in travel for [X years], most recently as [role] at [company].",
  "I'm looking for [type of role] because [reason].",
  "Languages I speak: [languages].",
];
