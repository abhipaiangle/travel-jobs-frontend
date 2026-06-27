import useSWR from "swr";
import { api } from "@/lib/api";

const fetcher = (url) => api.get(url).then((r) => r.data);

export default function Jobs() {
  const { data, error, isLoading } = useSWR("/api/jobs", fetcher);

  if (isLoading) return <div className="container py-10">Loading jobs…</div>;
  if (error) return <div className="container py-10 text-red-500">Failed to load jobs.</div>;

  const jobs = data ?? [];
  return (
    <section className="container py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Open roles</h2>
      <p className="mt-1 text-sm text-muted-foreground">Full-time travel-industry positions.</p>

      {jobs.length === 0 ? (
        <div className="mt-8 rounded-lg border p-8 text-center text-muted-foreground">
          No jobs yet. Check back soon.
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {jobs.map((j) => (
            <li key={j.job_id} className="rounded-lg border p-4 hover:border-primary transition">
              <div className="font-medium">{j.title}</div>
              <div className="text-sm text-muted-foreground">
                {j.city}, {j.state} · ₹{j.salary_min.toLocaleString()}–₹{j.salary_max.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
