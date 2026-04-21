import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../app/session";

const navItems = [
  { to: "/write", label: "Write" },
  { to: "/ingest", label: "Fragments" },
  { to: "/search", label: "Search" },
  { to: "/books", label: "Books" },
  { to: "/projects", label: "Studio (Advanced)" },
];

export function AppShell() {
  const { user, signOut } = useSession();
  return (
    <main className="app shell">
      <header className="shell-topbar">
        <div>
          <h1>Tooth</h1>
          <p className="muted">Writing-first studio with attached AI</p>
        </div>
        <div className="topbar-user">
          <span className="muted">{user?.email}</span>
          <button type="button" className="btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <section className="shell-body">
        <nav className="shell-nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "shell-nav-link is-active" : "shell-nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <section className="shell-content">
        <Outlet />
        </section>
      </section>
    </main>
  );
}
