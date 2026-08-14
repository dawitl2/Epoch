"use client";

import {
  Compass,
  Globe2,
  Home,
  Hourglass,
  Library,
  TrendingUp,
} from "lucide-react";

export type PrimaryView = "home" | "regions" | "modes" | "progress";

type Props = {
  activeView: PrimaryView | "quiz";
  onNavigate: (view: PrimaryView) => void;
  children: React.ReactNode;
};

const navItems = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "regions" as const, label: "Regions", icon: Globe2 },
  { id: "modes" as const, label: "Modes", icon: Library },
  { id: "progress" as const, label: "Progress", icon: TrendingUp },
];

export function EpochMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`epoch-mark ${compact ? "epoch-mark--compact" : ""}`} aria-label="Epoch">
      <span className="epoch-mark__icon"><Hourglass size={compact ? 17 : 19} strokeWidth={1.6} aria-hidden="true" /></span>
      <span>Epoch</span>
    </div>
  );
}

export function AppShell({ activeView, onNavigate, children }: Props) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <EpochMark />
        <p className="sidebar-kicker">A living atlas of history</p>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={`nav-item ${activeView === id ? "is-active" : ""}`}
              onClick={() => onNavigate(id)}
              aria-current={activeView === id ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.65} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <Compass size={17} strokeWidth={1.5} aria-hidden="true" />
          <p>Every place holds more than one history.</p>
        </div>
      </aside>

      <header className="mobile-header">
        <EpochMark compact />
        <span className="mobile-header__edition">World history · Vol. I</span>
      </header>

      <main className="main-content">{children}</main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={activeView === id ? "is-active" : ""}
            onClick={() => onNavigate(id)}
            aria-current={activeView === id ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={1.65} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

