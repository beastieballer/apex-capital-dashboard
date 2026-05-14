"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getJob, upsertJob, removeJob } from "@/lib/store";
import type { Job, JobStatus } from "@/lib/types";
import AppShell from "@/components/AppShell";
import JobNav from "@/components/JobNav";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const STATUSES: JobStatus[] = ["draft", "scheduled", "in_progress", "completed", "invoiced", "paid"];
const FILM_TYPES = ["Solar Control", "Privacy", "Security", "Decorative", "Anti-Glare", "Ceramic", "Dual Reflective", "Carbon", "Nano Ceramic"];

export default function JobOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setJob(getJob(id) ?? null); }, [id]);

  function save() {
    if (!job) return;
    upsertJob({ ...job, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function del() {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    removeJob(id);
    router.push("/jobs");
  }

  if (!job) return <AppShell><p className="text-slate-400 pt-10 text-center">Job not found.</p></AppShell>;

  const set = (k: keyof Job, v: unknown) => setJob((j) => j ? { ...j, [k]: v } : j);
  const setCust = (k: string, v: string) => setJob((j) => j ? { ...j, customer: { ...j.customer, [k]: v } } : j);

  return (
    <AppShell>
      <div className="flex items-center gap-3 mb-2 no-print">
        <Link href="/jobs" className="btn-ghost"><ArrowLeft size={15} /> Jobs</Link>
        <div className="flex-1">
          <span className="font-mono text-amber-400 text-xs">{job.jobNumber}</span>
          <h1 className="text-lg font-bold text-slate-100 leading-tight">{job.customer.name || "Unnamed Job"}</h1>
        </div>
        <button onClick={save} className={clsx("btn-primary", saved && "bg-green-500 hover:bg-green-400")}>
          <Save size={14} />{saved ? "Saved!" : "Save"}
        </button>
        <button onClick={del} className="btn-danger"><Trash2 size={14} /></button>
      </div>

      <JobNav jobId={id} />

      <div className="space-y-5 max-w-3xl">
        {/* Status */}
        <div className="card">
          <h2 className="section-title">Job Status</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button key={s} onClick={() => set("status", s)}
                className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
                  job.status === s
                    ? "bg-amber-500 border-amber-500 text-slate-950"
                    : "border-slate-600 text-slate-400 hover:border-slate-400")}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Customer */}
        <div className="card">
          <h2 className="section-title">Customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Name</label>
              <input className="input" value={job.customer.name} onChange={(e) => setCust("name", e.target.value)} /></div>
            <div><label className="label">Phone</label>
              <input className="input" value={job.customer.phone} onChange={(e) => setCust("phone", e.target.value)} /></div>
            <div><label className="label">Email</label>
              <input className="input" type="email" value={job.customer.email} onChange={(e) => setCust("email", e.target.value)} /></div>
            <div><label className="label">Address</label>
              <input className="input" value={job.customer.address} onChange={(e) => setCust("address", e.target.value)} /></div>
            <div><label className="label">City</label>
              <input className="input" value={job.customer.city} onChange={(e) => setCust("city", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">State</label>
                <input className="input" value={job.customer.state} maxLength={2}
                  onChange={(e) => setCust("state", e.target.value.toUpperCase())} /></div>
              <div><label className="label">ZIP</label>
                <input className="input" value={job.customer.zip} onChange={(e) => setCust("zip", e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="card">
          <h2 className="section-title">Job Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input min-h-[80px] resize-none" value={job.description}
                onChange={(e) => set("description", e.target.value)} /></div>
            <div><label className="label">Location Type</label>
              <select className="input" value={job.location} onChange={(e) => set("location", e.target.value)}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="automotive">Automotive</option>
              </select></div>
            <div><label className="label">Default Film Type</label>
              <select className="input" value={job.defaultFilmType} onChange={(e) => set("defaultFilmType", e.target.value)}>
                {FILM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select></div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="section-title">Pricing</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="label">Roll Width</label>
              <select className="input" value={job.materialWidth} onChange={(e) => set("materialWidth", Number(e.target.value) as 60 | 72)}>
                <option value={60}>60" (5 ft)</option>
                <option value={72}>72" (6 ft)</option>
              </select></div>
            <div><label className="label">Price / Sq Ft ($)</label>
              <input className="input" type="number" min={0} step={0.5} value={job.pricePerSqFt}
                onChange={(e) => set("pricePerSqFt", Number(e.target.value))} /></div>
            <div><label className="label">Labor Rate ($/hr)</label>
              <input className="input" type="number" min={0} value={job.laborRate}
                onChange={(e) => set("laborRate", Number(e.target.value))} /></div>
            <div><label className="label">Labor Hours</label>
              <input className="input" type="number" min={0} step={0.5} value={job.laborHours}
                onChange={(e) => set("laborHours", Number(e.target.value))} /></div>
            <div><label className="label">Tax Rate (%)</label>
              <input className="input" type="number" min={0} step={0.1} value={job.taxRate}
                onChange={(e) => set("taxRate", Number(e.target.value))} /></div>
            <div><label className="label">Discount ($)</label>
              <input className="input" type="number" min={0} value={job.discount}
                onChange={(e) => set("discount", Number(e.target.value))} /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Notes</h2>
          <textarea className="input min-h-[80px] resize-none" value={job.notes}
            onChange={(e) => set("notes", e.target.value)} placeholder="Access codes, special instructions..." />
        </div>

        <button onClick={save} className={clsx("btn-primary w-full justify-center py-3", saved && "bg-green-500 hover:bg-green-400")}>
          <Save size={16} />{saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </AppShell>
  );
}
