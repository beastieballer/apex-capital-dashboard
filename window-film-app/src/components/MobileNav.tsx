"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Plus } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/jobs/new", icon: Plus, label: "New Job" },
];

export default function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex z-20 no-print">
      {nav.map(({ href, icon: Icon, label }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className={clsx(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
              active ? "text-amber-400" : "text-slate-500 hover:text-slate-200"
            )}>
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
