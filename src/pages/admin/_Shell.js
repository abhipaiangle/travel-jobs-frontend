import { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Building2, Briefcase, Users, LayoutDashboard, LogOut } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/employers", label: "Employers", icon: Building2 },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/applications", label: "Applications", icon: Users },
];

export default function AdminShell({ children, title, actions }) {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { nav("/admin/login"); return; }
    if (user.role !== "admin") { nav("/"); }
  }, [user, loading, nav]);

  const doLogout = async () => {
    await logout();
    nav("/admin/login");
  };

  if (loading || !user || user.role !== "admin") {
    return <div className="min-h-screen grid place-items-center text-slate-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden sm:flex w-56 flex-col bg-slate-900 text-slate-100 py-6 px-3 sticky top-0 h-screen">
        <div className="px-2 mb-6">
          <img src="/opsyjobs-logo-on-dark.svg" alt="OpsyJobs" className="h-9 w-auto" />
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-2">Admin</div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
                }`
              }
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/10 text-xs text-slate-400">
          <div className="px-2 mb-2 truncate">{user.email}</div>
          <button
            onClick={doLogout}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="sm:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <button onClick={doLogout} className="text-xs text-slate-300">Sign out</button>
        </div>
        <div className="sm:hidden bg-white border-b border-slate-200 px-2 py-2 flex gap-1 overflow-x-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 border border-slate-200"
                }`
              }
            >
              <n.icon className="h-3.5 w-3.5" /> {n.label}
            </NavLink>
          ))}
        </div>

        <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-6xl">
          {(title || actions) && (
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              {title && <h1 className="font-display text-2xl sm:text-3xl font-semibold">{title}</h1>}
              {actions}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
