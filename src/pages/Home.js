import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="container py-20">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Hiring for travel, done right.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Full-time travel-industry roles only. Candidates apply with a 60-second voice
          intro so you hear them before you call them.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-3xl">
        <Link
          to="/employer"
          className="rounded-lg border p-6 hover:border-primary transition"
        >
          <div className="text-sm font-medium text-primary">For employers</div>
          <div className="mt-2 text-xl font-semibold">Hire Talent</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Post travel-only roles. Pick a plan. Get shortlisted candidates with voice intros.
          </p>
        </Link>
        <Link
          to="/jobs"
          className="rounded-lg border p-6 hover:border-primary transition"
        >
          <div className="text-sm font-medium text-primary">For candidates</div>
          <div className="mt-2 text-xl font-semibold">Find Jobs</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse open roles at travel agencies. Apply once, then one-click after that.
          </p>
        </Link>
      </div>
    </section>
  );
}
