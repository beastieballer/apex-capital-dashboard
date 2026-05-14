"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getJob, upsertJob } from "@/lib/store";
import type { Job, WindowPane } from "@/lib/types";
import AppShell from "@/components/AppShell";
import JobNav from "@/components/JobNav";
import { Plus, Camera, Sparkles, Check, AlertTriangle, X, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import clsx from "clsx";

const FILM_TYPES = ["Solar Control", "Privacy", "Security", "Decorative", "Anti-Glare", "Ceramic", "Dual Reflective", "Carbon", "Nano Ceramic"];
const newPane = (): WindowPane => ({ id: uuidv4(), name: "", width: 0, height: 0, quantity: 1, filmType: "", notes: "" });

export default function MeasurementsPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setJob(getJob(id) ?? null); }, [id]);

  const upd = (wId: string, patch: Partial<WindowPane>) =>
    setJob((j) => j ? { ...j, windows: j.windows.map((w) => w.id === wId ? { ...w, ...patch } : w) } : j);

  const addWindow = () => setJob((j) => j ? { ...j, windows: [...j.windows, newPane()] } : j);
  const removeWindow = (wId: string) => setJob((j) => j ? { ...j, windows: j.windows.filter((w) => w.id !== wId) } : j);

  function save() {
    if (!job) return;
    upsertJob({ ...job, updatedAt: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handlePhotoUpload(wId: string, file: File) {
    setUploading(wId);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const { url } = await res.json();
    upd(wId, { photoUrl: url, aiAnalyzed: false });
    setUploading(null);
  }

  async function analyzeWindow(w: WindowPane) {
    if (!w.photoUrl) return;
    setAnalyzing(w.id);
    try {
      const imgRes = await fetch(w.photoUrl);
      const blob = await imgRes.blob();
      const base64: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      const resp = await fetch("/api/analyze-window", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: blob.type || "image/jpeg" }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      upd(w.id, {
        width: Math.round(data.width),
        height: Math.round(data.height),
        notes: data.notes ? `[AI: ${data.notes}]` : w.notes,
        aiAnalyzed: true,
        aiConfidence: data.confidence,
      });
    } catch (err) {
      alert("AI analysis failed: " + String(err));
    }
    setAnalyzing(null);
  }

  if (!job) return <AppShell><p className="text-slate-400 pt-10 text-center">Job not found.</p></AppShell>;

  const totalSqFt = job.windows.reduce((s, w) => s + (w.width * w.height * w.quantity) / 144, 0);
  const totalLinFt = job.windows.reduce((s, w) => s + (w.height * w.quantity) / 12, 0);

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-2 no-print">
        <div>
          <span className="font-mono text-amber-400 text-xs">{job.jobNumber}</span>
          <h1 className="text-lg font-bold text-slate-100">{job.customer.name || "Unnamed Job"}</h1>
        </div>
        <button onClick={save} className={clsx("btn-primary", saved && "bg-green-500 hover:bg-green-400")}>
          <Save size={14} />{saved ? "Saved!" : "Save"}
        </button>
      </div>

      <JobNav jobId={id} />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Panes", value: job.windows.reduce((s, w) => s + w.quantity, 0) },
          { label: "Sq Ft", value: totalSqFt.toFixed(1) },
          { label: "Lin Ft", value: totalLinFt.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-3">
            <div className="text-xl font-bold text-amber-400">{value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Window List</h2>
          <button onClick={addWindow} className="btn-primary"><Plus size={14} /> Add Window</button>
        </div>

        {job.windows.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            <p className="mb-3 text-sm">No windows added yet.</p>
            <button onClick={addWindow} className="btn-primary mx-auto"><Plus size={14} /> Add Window</button>
          </div>
        ) : (
          <div className="space-y-3">
            {job.windows.map((w, idx) => (
              <div key={w.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-mono shrink-0 mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                      <label className="label">Name</label>
                      <input className="input" placeholder="Living Room Front"
                        value={w.name} onChange={(e) => upd(w.id, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Width″</label>
                      <input className="input" type="number" min={0} step={0.25} placeholder="36"
                        value={w.width || ""} onChange={(e) => upd(w.id, { width: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Height″</label>
                      <input className="input" type="number" min={0} step={0.25} placeholder="48"
                        value={w.height || ""} onChange={(e) => upd(w.id, { height: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Qty</label>
                      <input className="input" type="number" min={1}
                        value={w.quantity} onChange={(e) => upd(w.id, { quantity: Number(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Film</label>
                      <select className="input" value={w.filmType || job.defaultFilmType}
                        onChange={(e) => upd(w.id, { filmType: e.target.value })}>
                        {FILM_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-3 lg:col-span-6">
                      <label className="label">Notes</label>
                      <input className="input" placeholder="Special notes..."
                        value={w.notes ?? ""} onChange={(e) => upd(w.id, { notes: e.target.value })} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-1">
                    <div className="text-xs text-slate-500">sqft</div>
                    <div className="font-bold text-amber-400 text-sm">{((w.width * w.height * w.quantity) / 144).toFixed(1)}</div>
                  </div>
                  <button onClick={() => removeWindow(w.id)} className="text-slate-600 hover:text-red-400 transition-colors shrink-0 mt-1">
                    <X size={15} />
                  </button>
                </div>

                {/* Photo upload */}
                <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap items-center gap-2">
                  <label htmlFor={`photo-${w.id}`}
                    className={clsx("btn-secondary cursor-pointer text-xs", uploading === w.id && "opacity-50 pointer-events-none")}>
                    <Camera size={12} />{uploading === w.id ? "Uploading..." : "Upload Photo"}
                  </label>
                  <input id={`photo-${w.id}`} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => { if (e.target.files?.[0]) await handlePhotoUpload(w.id, e.target.files[0]); e.target.value = ""; }} />

                  {w.photoUrl && (
                    <>
                      <div className="relative w-14 h-10 rounded overflow-hidden border border-slate-600">
                        <Image src={w.photoUrl} alt="window" fill className="object-cover" />
                      </div>
                      <button onClick={() => analyzeWindow(w)} disabled={analyzing === w.id} className="btn-primary text-xs">
                        <Sparkles size={12} />{analyzing === w.id ? "Analyzing..." : "Measure with AI"}
                      </button>
                      {w.aiAnalyzed && (
                        <span className={clsx("badge gap-1", {
                          "bg-green-900/50 text-green-300": w.aiConfidence === "high",
                          "bg-amber-900/50 text-amber-300": w.aiConfidence === "medium",
                          "bg-red-900/50 text-red-300": w.aiConfidence === "low",
                        })}>
                          {w.aiConfidence === "high" ? <Check size={10} /> : <AlertTriangle size={10} />}
                          AI {w.aiConfidence}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 no-print">
        <button onClick={addWindow} className="btn-secondary"><Plus size={14} /> Add Window</button>
        <button onClick={save} className={clsx("btn-primary", saved && "bg-green-500 hover:bg-green-400")}>
          {saved ? "Saved!" : "Save Measurements"}
        </button>
      </div>
    </AppShell>
  );
}
