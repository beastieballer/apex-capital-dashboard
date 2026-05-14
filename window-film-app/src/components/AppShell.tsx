"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { Menu, X } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-40 w-64">
            <Sidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-3 text-slate-400 hover:text-slate-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-60 min-h-screen pb-20 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-100">
            <Menu size={22} />
          </button>
          <span className="font-bold text-slate-100 text-sm">FilmFlow Pro</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">{children}</div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </main>
    </div>
  );
}
