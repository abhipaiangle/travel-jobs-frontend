import { Routes, Route, Link } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import Jobs from "@/pages/Jobs";

function NavBar() {
  return (
    <header className="border-b">
      <div className="container flex items-center justify-between py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          TravelJobs
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/jobs" className="text-muted-foreground hover:text-foreground">
            Browse jobs
          </Link>
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
        </Routes>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
