"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadJobs } from "@/lib/store";
import { calcWindowSqFt } from "@/lib/cutsheet";
import type { Job } from "@/lib/types";
import AppShell from "@/components/AppShell";
import {
  Briefcase, DollarSign, CheckCircle, Clock, Plus, ArrowRight,
} from "lucide-react";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  draft:       "bg-slate-700 text-slate-300",
  scheduled:   "bg-blue-900/50 text-blue-300",
  in_progress: "bg-amber-900/50 text-amber-300",
  completed:   "bg-green-900/50 text-green-300",
  invoiced:    "bg-purple-900/50 text-purple-300",
  paid:        "bg-emerald-900/50 text-emerald-300",
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    setJobs(loadJobs().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  const totalRevenue = jobs.reduce((sum, j) => {
    const sqft = calcWindowSqFt(j.windows);
    return sum + sqft * j.pricePerSqFt + j.laborRate * j.laborHours;
  }, 0);

  const activeJobs = jobs.filter((j) => ["scheduled", "in_progress"].includes(j.status)).length;
  const doneJobs   = jobs.filter((j) => ["completed", "paid"].includes(j.status)).length;
  const pendingPay = jobs.filter((j) => j.status === "invoiced").length;

  const stats = [
    { label: "Total Jobs",    value: jobs.length,                  icon: Briefcase,   color: "text-blue-400" },
    { label: "Active",        value: activeJobs,                   icon: Clock,        color: "text-amber-400" },
    { label: "Completed",     value: doneJobs,                     icon: CheckCircle,  color: "text-green-400" },
    { label: "Est. Revenue",  value: `$${totalRevenue.toFixed(0)}`, icon: DollarSign,  color: "text-emerald-400" },
  ];

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Your window film jobs at a glance.</p>
        </div>
        <Link href="/jobs/new" className="btn-primary">
          <Plus size={15} /> New Job
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={clsx("w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center", color)}>
              <Icon size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-100">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {pendingPay > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4 flex items-center justify-between">
          <p className="text-amber-300 text-sm font-medium">
            {pendingPay} job{pendingPay > 1 ? "s" : ""} awaiting payment
          </p>
          <Link href="/jobs" className="text-amber-400 text-xs underline">View all</Link>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent Jobs</h2>
          <Link href="/jobs" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Briefcase size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No jobs yet.</p>
            <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
              <Plus size={14} /> Create first job
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
                  <th className="pb-2 pr-4">Job #</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4 hidden sm:table-cell">Description</th>
                  <th className="pb-2 pr-4">Windows</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.slice(0, 10).map((job) => (
                  <tr key={job.id} className="table-row">
                    <td className="py-3 pr-4 font-mono text-amber-400 text-xs">{job.jobNumber}</td>
                    <td className="py-3 pr-4 font-medium">{job.customer.name || "—"}</td>
                    <td className="py-3 pr-4 text-slate-400 max-w-xs truncate hidden sm:table-cell">{job.description || "—"}</td>
                    <td className="py-3 pr-4 text-slate-300">{job.windows.length}</td>
                    <td className="py-3 pr-4">
                      <span className={clsx("badge", STATUS_STYLES[job.status] ?? "bg-slate-700 text-slate-300")}>
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link href={`/jobs/${job.id}`} className="btn-ghost py-1">
                        Open <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
