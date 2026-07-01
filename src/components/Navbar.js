import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Plane, Menu, X, User2, Briefcase, LogOut, LayoutDashboard, FileText, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `text-sm transition ${isActive ? "text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900"}`
      }
    >
      {children}
    </NavLink>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="h-9 w-9 rounded-lg bg-slate-900 text-white grid place-items-center group-hover:bg-slate-800 transition">
        <Plane className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="leading-none">
        <div className="font-display text-lg font-semibold text-slate-900">
          Opsy<span className="text-blue-600">Jobs</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
          by <img src="/ht-logo.png" alt="HelloTravel" className="h-5 w-auto" />
        </div>
      </div>
    </Link>
  );
}

function CandidateMenu({ user, logout, close }) {
  return (
    <>
      <Link to="/me/profile" onClick={close} className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <User2 className="h-4 w-4" /> My profile
      </Link>
      <Link to="/me/applications" onClick={close} className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <FileText className="h-4 w-4" /> My applications
      </Link>
      <button onClick={() => { close(); logout(); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </>
  );
}

function EmployerMenu({ user, logout, close }) {
  return (
    <>
      <Link to="/employer" onClick={close} className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <LayoutDashboard className="h-4 w-4" /> Dashboard
      </Link>
      <Link to="/employer/shortlisted" onClick={close} className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <Sparkles className="h-4 w-4" /> Pipeline
      </Link>
      <Link to="/employer/profile" onClick={close} className="px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <Briefcase className="h-4 w-4" /> Company profile
      </Link>
      <button onClick={() => { close(); logout(); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const onLogout = async () => {
    await logout();
    nav("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200/70">
      <div className="tj-container h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Brand />
          <nav className="hidden md:flex items-center gap-6">
            <NavItem to="/jobs">Find Jobs</NavItem>
            <NavItem to="/for-employers">For Employers</NavItem>
            <NavItem to="/employer/plans">Pricing</NavItem>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {!user && (
            <>
              <Link to="/candidate/login">
                <Button variant="ghost" size="sm">Candidate sign in</Button>
              </Link>
              <Link to="/employer/login">
                <Button variant="outline" size="sm">Employer sign in</Button>
              </Link>
              <Link to="/candidate/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 hover:bg-slate-100 border border-slate-200"
              >
                <div className="h-7 w-7 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-medium">
                  {(user.email || "?")[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-slate-700 capitalize">{user.role}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lift overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-slate-100">
                    <div className="text-xs text-slate-500">Signed in as</div>
                    <div className="text-sm truncate">{user.email || user.phone}</div>
                  </div>
                  {user.role === "candidate"
                    ? <CandidateMenu user={user} logout={onLogout} close={() => setMenuOpen(false)} />
                    : <EmployerMenu user={user} logout={onLogout} close={() => setMenuOpen(false)} />}
                </div>
              )}
            </div>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen((s) => !s)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="tj-container py-4 grid gap-3 text-sm">
            <Link to="/jobs" onClick={() => setOpen(false)}>Find Jobs</Link>
            <Link to="/for-employers" onClick={() => setOpen(false)}>For Employers</Link>
            <Link to="/employer/plans" onClick={() => setOpen(false)}>Pricing</Link>
            <div className="border-t pt-3 grid gap-2">
              {!user && (
                <>
                  <Link to="/candidate/login" onClick={() => setOpen(false)} className="text-slate-900">Candidate sign in</Link>
                  <Link to="/employer/login" onClick={() => setOpen(false)} className="text-slate-900">Employer sign in</Link>
                  <Link to="/candidate/signup" onClick={() => setOpen(false)}>
                    <Button className="w-full">Get started</Button>
                  </Link>
                </>
              )}
              {user?.role === "candidate" && (
                <>
                  <Link to="/me/profile" onClick={() => setOpen(false)}>My profile</Link>
                  <Link to="/me/applications" onClick={() => setOpen(false)}>My applications</Link>
                  <button onClick={onLogout} className="text-left">Sign out</button>
                </>
              )}
              {user?.role === "employer" && (
                <>
                  <Link to="/employer" onClick={() => setOpen(false)}>Dashboard</Link>
                  <Link to="/employer/shortlisted" onClick={() => setOpen(false)}>Pipeline</Link>
                  <Link to="/employer/profile" onClick={() => setOpen(false)}>Company profile</Link>
                  <button onClick={onLogout} className="text-left">Sign out</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
