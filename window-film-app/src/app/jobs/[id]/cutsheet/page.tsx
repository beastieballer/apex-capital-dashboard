"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getJob } from "@/lib/store";
import type { Job } from "@/lib/types";
import { buildCutSheet } from "@/lib/cutsheet";
import AppShell from "@/components/AppShell";
import JobNav from "@/components/JobNav";
import { Printer } from "lucide-react";
import clsx from "clsx";

export default function CutSheetPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [rollWidth, setRollWidth] = useState<60 | 72>(60);

  useEffect(() => {
    const j = getJob(id);
    if (j) { setJob(j); setRollWidth(j.materialWidth); }
  }, [id]);

  if (!job) return <AppShell><p className="text-slate-400 pt-10 text-center">Job not found.</p></AppShell>;

  const sheet = buildCutSheet(job.windows, rollWidth);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-2 no-print">
        <div>
          <span className="font-mono text-amber-400 text-xs">{job.jobNumber}</span>
          <h1 className="text-lg font-bold text-slate-100">{job.customer.name || "Unnamed Job"}</h1>
        </div>
        <button onClick={() => window.print()} className="btn-secondary no-print">
          <Printer size={14} /> Print
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Cut Sheet — {job.jobNumber}</h1>
        <p>{job.customer.name} · {[job.customer.address, job.customer.city].filter(Boolean).join(", ")}</p>
        <p className="text-sm text-gray-600">Roll: {rollWidth}" · {new Date().toLocaleDateString()}</p>
      </div>

      <JobNav jobId={id} />

      {/* Roll width toggle */}
      <div className="card mb-5 no-print">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="label mb-2">Roll Width</p>
            <div className="flex gap-2">
              {([60, 72] as const).map((w) => (
                <button key={w} onClick={() => setRollWidth(w)}
                  className={clsx("px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    rollWidth === w ? "bg-amber-500 border-amber-500 text-slate-950" : "border-slate-600 text-slate-400 hover:border-slate-400")}>
                  {w}" ({w / 12} ft)
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-slate-400">
            {job.windows.length} window types · {job.windows.reduce((s, w) => s + w.quantity, 0)} panes
          </div>
        </div>
      </div>

      {job.windows.length === 0 ? (
        <div className="card text-center py-12 text-slate-500">Add windows in the Measurements tab first.</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Strips", value: sheet.strips.length },
              { label: "Lin Ft Needed", value: sheet.totalLinFt.toFixed(2) },
              { label: "Material Sq Ft", value: (sheet.totalLinFt * rollWidth / 12).toFixed(1) },
              { label: "Efficiency", value: `${sheet.efficiency.toFixed(0)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="card text-center py-3">
                <div className="text-xl font-bold text-amber-400">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Visual diagram */}
          <div className="card mb-5">
            <h2 className="section-title">Roll Layout — {rollWidth}" wide</h2>
            <div className="space-y-2">
              {sheet.strips.map((strip, si) => (
                <div key={si}>
                  <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                    <span className="font-mono w-14">Strip {si + 1}</span>
                    <span>{(strip.stripLength / 12).toFixed(2)} lin ft</span>
                    <span className="ml-auto text-slate-700">waste {strip.wasteWidth.toFixed(0)}"</span>
                  </div>
                  <div className="relative h-10 bg-slate-900 rounded border border-slate-700 overflow-hidden">
                    {strip.pieces.map(({ piece, xOffset }, pi) => {
                      const colors = [
                        "bg-amber-500/40 border-amber-400/60",
                        "bg-blue-500/40 border-blue-400/60",
                        "bg-green-500/40 border-green-400/60",
                        "bg-purple-500/40 border-purple-400/60",
                        "bg-pink-500/40 border-pink-400/60",
                        "bg-teal-500/40 border-teal-400/60",
                      ];
                      return (
                        <div key={pi}
                          style={{ left: `${(xOffset / rollWidth) * 100}%`, width: `${(piece.pieceWidth / rollWidth) * 100}%` }}
                          className={clsx("absolute h-full border-r flex items-center justify-center text-xs font-mono truncate px-1", colors[pi % colors.length])}>
                          {piece.pieceWidth.toFixed(0)}"×{piece.pieceHeight.toFixed(0)}"
                        </div>
                      );
                    })}
                    {strip.wasteWidth > 0.5 && (
                      <div style={{ left: `${(strip.usedWidth / rollWidth) * 100}%`, width: `${(strip.wasteWidth / rollWidth) * 100}%` }}
                        className="absolute h-full bg-red-900/20 flex items-center justify-center text-xs text-red-600">
                        waste
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cut list table */}
          <div className="card overflow-x-auto">
            <h2 className="section-title">Cut List</h2>
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-700">
                  <th className="pb-2 pr-3">#</th>
                  <th className="pb-2 pr-3">Window</th>
                  <th className="pb-2 pr-3">Cut W</th>
                  <th className="pb-2 pr-3">Cut H</th>
                  <th className="pb-2 pr-3">Lin Ft</th>
                  <th className="pb-2 pr-3">Rotated</th>
                  <th className="pb-2">Sq Ft</th>
                </tr>
              </thead>
              <tbody>
                {sheet.strips.map((strip, si) =>
                  strip.pieces.map(({ piece }, pi) => (
                    <tr key={`${si}-${pi}`} className="table-row">
                      <td className="py-2 pr-3 text-slate-500 font-mono text-xs">{si + 1}</td>
                      <td className="py-2 pr-3 text-slate-200">{piece.windowName || "Window"}</td>
                      <td className="py-2 pr-3 font-mono text-slate-300">{piece.pieceWidth.toFixed(1)}"</td>
                      <td className="py-2 pr-3 font-mono text-slate-300">{piece.pieceHeight.toFixed(1)}"</td>
                      <td className="py-2 pr-3 font-mono text-slate-400">{(piece.pieceHeight / 12).toFixed(2)}</td>
                      <td className="py-2 pr-3 text-xs">{piece.rotated ? <span className="text-amber-400">Yes</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="py-2 font-medium text-amber-400">{((piece.pieceWidth * piece.pieceHeight) / 144).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-600">
                  <td colSpan={4} className="pt-3 text-slate-400 text-xs">TOTAL</td>
                  <td className="pt-3 font-mono font-bold text-slate-200">{sheet.totalLinFt.toFixed(2)}</td>
                  <td></td>
                  <td className="pt-3 font-bold text-amber-400">{sheet.totalSqFt.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
}
