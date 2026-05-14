"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { upsertJob, nextJobNumber } from "@/lib/store";
import type { Job } from "@/lib/types";
import AppShell from "@/components/AppShell";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

const FILM_TYPES = ["Solar Control", "Privacy", "Security", "Decorative", "Anti-Glare", "Ceramic", "Dual Reflective", "Carbon", "Nano Ceramic"];

export default function NewJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    description: "", location: "residential", defaultFilmType: "Solar Control",
    materialWidth: 60, pricePerSqFt: 8, laborRate: 65, laborHours: 0, taxRate: 0, discount: 0, notes: "",
    customer: { name: "", email: "", phone: "", address: "", city: "", state: "", zip: "" },
  });

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));
  const setCust = (k: string, v: string) => setForm((f) => ({ ...f, customer: { ...f.customer, [k]: v } }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const job: Job = {
      id: uuidv4(), jobNumber: nextJobNumber(), status: "draft",
      createdAt: now, updatedAt: now,
      customer: form.customer, description: form.description, location: form.location,
      materialWidth: form.materialWidth as 60 | 72, defaultFilmType: form.defaultFilmType,
      pricePerSqFt: form.pricePerSqFt, laborRate: form.laborRate, laborHours: form.laborHours,
      taxRate: form.taxRate, discount: form.discount, notes: form.notes,
      windows: [], beforePhotos: [], afterPhotos: [], payments: [],
    };
    upsertJob(job);
    router.push(`/jobs/${job.id}`);
  }

  return (
    <AppShell>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/jobs" className="btn-ghost"><ArrowLeft size={15} /> Back</Link>
        <h1 className="text-2xl font-bold text-slate-100">New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="card">
          <h2 className="section-title">Customer Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Full Name *</label>
              <input className="input" required value={form.customer.name} onChange={(e) => setCust("name", e.target.value)} placeholder="John Smith" /></div>
            <div><label className="label">Phone</label>
              <input className="input" value={form.customer.phone} onChange={(e) => setCust("phone", e.target.value)} placeholder="555-555-5555" /></div>
            <div><label className="label">Email</label>
              <input className="input" type="email" value={form.customer.email} onChange={(e) => setCust("email", e.target.value)} placeholder="john@example.com" /></div>
            <div><label className="label">Street Address</label>
              <input className="input" value={form.customer.address} onChange={(e) => setCust("address", e.target.value)} placeholder="123 Main St" /></div>
            <div><label className="label">City</label>
              <input className="input" value={form.customer.city} onChange={(e) => setCust("city", e.target.value)} placeholder="Austin" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">State</label>
                <input className="input" value={form.customer.state} maxLength={2}
                  onChange={(e) => setCust("state", e.target.value.toUpperCase())} placeholder="TX" /></div>
              <div><label className="label">ZIP</label>
                <input className="input" value={form.customer.zip} onChange={(e) => setCust("zip", e.target.value)} placeholder="78701" /></div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Job Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Job Description *</label>
              <textarea className="input min-h-[80px] resize-none" required value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="e.g. Full house solar film install — 3BR/2BA single story..." /></div>
            <div><label className="label">Location Type</label>
              <select className="input" value={form.location} onChange={(e) => set("location", e.target.value)}>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="automotive">Automotive</option>
              </select></div>
            <div><label className="label">Default Film Type</label>
              <select className="input" value={form.defaultFilmType} onChange={(e) => set("defaultFilmType", e.target.value)}>
                {FILM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select></div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Material & Pricing</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="label">Roll Width</label>
              <select className="input" value={form.materialWidth} onChange={(e) => set("materialWidth", Number(e.target.value))}>
                <option value={60}>60" (5 ft)</option>
                <option value={72}>72" (6 ft)</option>
              </select></div>
            <div><label className="label">Price / Sq Ft ($)</label>
              <input className="input" type="number" min={0} step={0.5} value={form.pricePerSqFt}
                onChange={(e) => set("pricePerSqFt", Number(e.target.value))} /></div>
            <div><label className="label">Labor Rate ($/hr)</label>
              <input className="input" type="number" min={0} value={form.laborRate}
                onChange={(e) => set("laborRate", Number(e.target.value))} /></div>
            <div><label className="label">Est. Labor Hours</label>
              <input className="input" type="number" min={0} step={0.5} value={form.laborHours}
                onChange={(e) => set("laborHours", Number(e.target.value))} /></div>
            <div><label className="label">Tax Rate (%)</label>
              <input className="input" type="number" min={0} step={0.1} value={form.taxRate}
                onChange={(e) => set("taxRate", Number(e.target.value))} /></div>
            <div><label className="label">Discount ($)</label>
              <input className="input" type="number" min={0} value={form.discount}
                onChange={(e) => set("discount", Number(e.target.value))} /></div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">Internal Notes</h2>
          <textarea className="input min-h-[80px] resize-none" value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Access codes, parking info, special instructions..." />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            <Save size={15} /> Create Job
          </button>
          <Link href="/jobs" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </AppShell>
  );
}
