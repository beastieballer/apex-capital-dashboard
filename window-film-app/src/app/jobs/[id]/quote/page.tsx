"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getJob, upsertJob } from "@/lib/store";
import type { Job } from "@/lib/types";
import { calcWindowSqFt, buildCutSheet } from "@/lib/cutsheet";
import AppShell from "@/components/AppShell";
import JobNav from "@/components/JobNav";
import { Printer, Mail, Save } from "lucide-react";
import clsx from "clsx";

export default function QuotePage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setJob(getJob(id) ?? null); }, [id]);

  function save() {
    if (!job) return;
    upsertJob({ ...job, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  if (!job) return <AppShell><p className="text-slate-400 pt-10 text-center">Job not found.</p></AppShell>;

  const sqFt = calcWindowSqFt(job.windows);
  const sheet = buildCutSheet(job.windows, job.materialWidth);
  const materialCost = sqFt * job.pricePerSqFt;
  const laborCost = job.laborRate * job.laborHours;
  const subtotal = materialCost + laborCost - job.discount;
  const tax = subtotal * (job.taxRate / 100);
  const total = subtotal + tax;

  const quoteDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const validUntil = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-2 no-print">
        <div>
          <span className="font-mono text-amber-400 text-xs">{job.jobNumber}</span>
          <h1 className="text-lg font-bold text-slate-100">{job.customer.name || "Unnamed Job"}</h1>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={save} className={clsx("btn-secondary no-print", saved && "!bg-green-700 !text-green-100")}>
            <Save size={14} />{saved ? "Saved!" : "Save"}
          </button>
          <button onClick={() => window.print()} className="btn-secondary no-print">
            <Printer size={14} /> Print
          </button>
          {job.customer.email && (
            <a href={`mailto:${job.customer.email}?subject=Quote ${job.jobNumber}`} className="btn-primary no-print">
              <Mail size={14} /> Email
            </a>
          )}
        </div>
      </div>

      <JobNav jobId={id} />

      {/* Live pricing */}
      <div className="card mb-5 no-print">
        <h2 className="section-title">Pricing</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label className="label">$/Sq Ft</label>
            <input className="input" type="number" min={0} step={0.5} value={job.pricePerSqFt}
              onChange={(e) => setJob((j) => j ? { ...j, pricePerSqFt: Number(e.target.value) } : j)} /></div>
          <div><label className="label">Labor Rate</label>
            <input className="input" type="number" min={0} value={job.laborRate}
              onChange={(e) => setJob((j) => j ? { ...j, laborRate: Number(e.target.value) } : j)} /></div>
          <div><label className="label">Labor Hrs</label>
            <input className="input" type="number" min={0} step={0.5} value={job.laborHours}
              onChange={(e) => setJob((j) => j ? { ...j, laborHours: Number(e.target.value) } : j)} /></div>
          <div><label className="label">Tax %</label>
            <input className="input" type="number" min={0} step={0.1} value={job.taxRate}
              onChange={(e) => setJob((j) => j ? { ...j, taxRate: Number(e.target.value) } : j)} /></div>
          <div><label className="label">Discount ($)</label>
            <input className="input" type="number" min={0} value={job.discount}
              onChange={(e) => setJob((j) => j ? { ...j, discount: Number(e.target.value) } : j)} /></div>
          <div className="flex items-end">
            <div className="bg-slate-900 rounded-lg px-3 py-2 text-sm">
              <span className="text-slate-400">Total: </span>
              <span className="font-bold text-amber-400 text-lg">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* === PRINTABLE QUOTE === */}
      <div className="card print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
          <div>
            <div className="font-bold text-xl text-slate-100 print:text-black">
              {process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "ProFilm Window Tinting"}
            </div>
            <div className="text-xs text-slate-400 print:text-gray-600 space-y-0.5 mt-1">
              {process.env.NEXT_PUBLIC_BUSINESS_ADDRESS && <div>{process.env.NEXT_PUBLIC_BUSINESS_ADDRESS}</div>}
              {process.env.NEXT_PUBLIC_BUSINESS_PHONE && <div>{process.env.NEXT_PUBLIC_BUSINESS_PHONE}</div>}
              {process.env.NEXT_PUBLIC_BUSINESS_EMAIL && <div>{process.env.NEXT_PUBLIC_BUSINESS_EMAIL}</div>}
              {process.env.NEXT_PUBLIC_BUSINESS_LICENSE && <div>Lic# {process.env.NEXT_PUBLIC_BUSINESS_LICENSE}</div>}
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-3xl font-bold text-amber-500 print:text-black">QUOTE</div>
            <div className="text-xs text-slate-400 print:text-gray-600 mt-1 space-y-0.5">
              <div><span className="font-medium text-slate-300 print:text-black">#{job.jobNumber}</span></div>
              <div>Date: {quoteDate}</div>
              <div>Valid: {validUntil}</div>
            </div>
          </div>
        </div>

        {/* Bill To / Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 print:bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 print:text-gray-500 uppercase tracking-wide mb-2">Bill To</div>
            <div className="font-semibold text-slate-100 print:text-black">{job.customer.name || "—"}</div>
            <div className="text-xs text-slate-400 print:text-gray-600 mt-1 space-y-0.5">
              {job.customer.address && <div>{job.customer.address}</div>}
              {(job.customer.city || job.customer.state) && (
                <div>{[job.customer.city, job.customer.state, job.customer.zip].filter(Boolean).join(", ")}</div>
              )}
              {job.customer.phone && <div>{job.customer.phone}</div>}
              {job.customer.email && <div>{job.customer.email}</div>}
            </div>
          </div>
          <div className="bg-slate-900/50 print:bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-slate-500 print:text-gray-500 uppercase tracking-wide mb-2">Project</div>
            <div className="text-sm text-slate-300 print:text-gray-700">{job.description || "—"}</div>
            <div className="text-xs text-slate-500 print:text-gray-500 mt-1 capitalize">
              {job.location} · {job.defaultFilmType} · {job.materialWidth}" roll
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto -mx-5 px-5 print:mx-0 print:px-0">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-amber-500/10 print:bg-gray-100">
                {["Description", "Qty", "Unit", "Rate", "Total"].map((h, i) => (
                  <th key={h} className={clsx("px-3 py-2 text-xs uppercase tracking-wide text-slate-300 print:text-gray-700", i > 0 ? "text-right" : "text-left")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 print:divide-gray-200">
              {job.windows.map((w) => {
                const sf = (w.width * w.height * w.quantity) / 144;
                return (
                  <tr key={w.id}>
                    <td className="px-3 py-3 text-slate-200 print:text-black">
                      <div className="font-medium">{w.name || "Window"}</div>
                      <div className="text-xs text-slate-500 print:text-gray-500">
                        {w.width}″ × {w.height}″ · Qty {w.quantity} · {w.filmType || job.defaultFilmType}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-300 print:text-black">{sf.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-slate-500 print:text-gray-500">sq ft</td>
                    <td className="px-3 py-3 text-right text-slate-300 print:text-black">${job.pricePerSqFt.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-medium print:text-black">${(sf * job.pricePerSqFt).toFixed(2)}</td>
                  </tr>
                );
              })}
              {job.laborHours > 0 && (
                <tr>
                  <td className="px-3 py-3 text-slate-200 print:text-black">
                    <div className="font-medium">Installation Labor</div>
                    <div className="text-xs text-slate-500 print:text-gray-500">Professional installation service</div>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-300 print:text-black">{job.laborHours}</td>
                  <td className="px-3 py-3 text-right text-slate-500 print:text-gray-500">hrs</td>
                  <td className="px-3 py-3 text-right text-slate-300 print:text-black">${job.laborRate.toFixed(2)}</td>
                  <td className="px-3 py-3 text-right font-medium print:text-black">${laborCost.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mt-4">
          <div className="w-full sm:w-64 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-300 print:text-gray-700">
              <span>Material ({sqFt.toFixed(1)} sq ft)</span><span>${materialCost.toFixed(2)}</span>
            </div>
            {laborCost > 0 && (
              <div className="flex justify-between text-slate-300 print:text-gray-700">
                <span>Labor</span><span>${laborCost.toFixed(2)}</span>
              </div>
            )}
            {job.discount > 0 && (
              <div className="flex justify-between text-green-400 print:text-green-700">
                <span>Discount</span><span>-${job.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-300 print:text-gray-700 border-t border-slate-700 print:border-gray-300 pt-1.5">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {job.taxRate > 0 && (
              <div className="flex justify-between text-slate-300 print:text-gray-700">
                <span>Tax ({job.taxRate}%)</span><span>${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl border-t-2 border-amber-500 pt-2 text-amber-400 print:text-black">
              <span>TOTAL</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-slate-700 print:border-gray-200 text-xs text-slate-500 print:text-gray-500">
          Material: {sheet.totalLinFt.toFixed(1)} lin ft × {job.materialWidth}" roll · Coverage: {sqFt.toFixed(1)} sq ft
        </div>

        <div className="mt-4 bg-slate-900/50 print:bg-gray-50 rounded-lg p-3 text-xs text-slate-500 print:text-gray-600">
          <strong className="text-slate-300 print:text-black">Terms:</strong>{" "}
          Quote valid 30 days · 50% deposit to schedule · Balance due on completion · 1-yr labor warranty · Manufacturer film warranty included.
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-xs text-slate-500 print:text-gray-500">
          <div><div className="border-b border-slate-600 print:border-gray-400 pb-8 mb-2"></div>Customer Signature</div>
          <div><div className="border-b border-slate-600 print:border-gray-400 pb-8 mb-2"></div>Date Accepted</div>
        </div>
      </div>
    </AppShell>
  );
}
