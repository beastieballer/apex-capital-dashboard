"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { loadJobs } from "@/lib/store";
import { calcWindowSqFt } from "@/lib/cutsheet";
import type { Job } from "@/lib/types";
import AppShell from "@/components/AppShell";
import { Plus, ArrowRight, Briefcase } from "lucide-react";
import clsx from "clsx";

const STATUS_STYLES: Record<string, string> = {
  draft:       "bg-slate-700 text-slate-300",
  scheduled:   "bg-blue-900/50 text-blue-300",
  in_progress: "bg-amber-900/50 text-amber-300",
  completed:   "bg-green-900/50 text-green-300",
  invoiced:    "bg-purple-900/50 text-purple-300",
  paid:        "bg-emerald-900/50 text-emerald-300",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    setJobs(loadJobs().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }, []);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">All Jobs</h1>
        <Link href="/jobs/new" className="btn-primary">
          <Plus size={15} /> New Job
        </Link>
      </div>

      <div className="card overflow-x-auto">
        {jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Briefcase size={40} className="mx-auto mb-3 opacity-30" />
            <p>No jobs yet. Create your first job to get started.</p>
            <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
              <Plus size={14} /> Create Job
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
                <th className="pb-3 pr-4">Job #</th>
                <th className="pb-3 pr-4">Customer</th>
                <th className="pb-3 pr-4 hidden md:table-cell">City</th>
                <th className="pb-3 pr-4">Win</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Sq Ft</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Created</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="table-row">
                  <td className="py-3 pr-4 font-mono text-amber-400 text-xs">{job.jobNumber}</td>
                  <td className="py-3 pr-4 font-medium text-slate-100">{job.customer.name || "—"}</td>
                  <td className="py-3 pr-4 text-slate-400 text-xs hidden md:table-cell">
                    {job.customer.city || "—"}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{job.windows.length}</td>
                  <td className="py-3 pr-4 text-slate-300 hidden sm:table-cell">{calcWindowSqFt(job.windows).toFixed(1)}</td>
                  <td className="py-3 pr-4">
                    <span className={clsx("badge", STATUS_STYLES[job.status] ?? "bg-slate-700 text-slate-300")}>
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-500 text-xs hidden lg:table-cell">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3">
                    <Link href={`/jobs/${job.id}`} className="btn-ghost py-1 px-2">
                      Open <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
