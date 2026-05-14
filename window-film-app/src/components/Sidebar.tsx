"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Plus, Settings, Film,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "All Jobs" },
  { href: "/jobs/new", icon: Plus, label: "New Job" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 border-r border-slate-700 flex flex-col z-20 no-print">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <Film size={20} className="text-slate-950" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-sm leading-tight">FilmFlow Pro</div>
            <div className="text-xs text-slate-500">Window Film Manager</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              )}
            >
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700">
        <Link href="/settings" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <Settings size={13} />
          Settings
        </Link>
        <p className="text-xs text-slate-600 mt-2">FilmFlow Pro v1.0</p>
      </div>
    </aside>
  );
}
