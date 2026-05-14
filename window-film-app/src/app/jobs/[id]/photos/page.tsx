"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getJob, upsertJob } from "@/lib/store";
import type { Job } from "@/lib/types";
import AppShell from "@/components/AppShell";
import JobNav from "@/components/JobNav";
import { Camera, Trash2, Upload, ZoomIn, X } from "lucide-react";
import Image from "next/image";
import clsx from "clsx";

type PhotoType = "before" | "after";

export default function PhotosPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [uploading, setUploading] = useState<PhotoType | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => { setJob(getJob(id) ?? null); }, [id]);

  function patch(updates: Partial<Job>) {
    if (!job) return;
    const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
    upsertJob(updated);
    setJob(updated);
  }

  async function upload(type: PhotoType, files: FileList | null) {
    if (!files || files.length === 0 || !job) return;
    setUploading(type);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const { url } = await res.json();
      urls.push(url);
    }
    const existing = type === "before" ? job.beforePhotos : job.afterPhotos;
    const updated = [...existing, ...urls];
    patch(type === "before" ? { beforePhotos: updated } : { afterPhotos: updated });
    setUploading(null);
  }

  function removePhoto(type: PhotoType, url: string) {
    if (!job) return;
    const existing = type === "before" ? job.beforePhotos : job.afterPhotos;
    patch(type === "before"
      ? { beforePhotos: existing.filter((u) => u !== url) }
      : { afterPhotos: existing.filter((u) => u !== url) });
  }

  if (!job) return <AppShell><p className="text-slate-400 pt-10 text-center">Job not found.</p></AppShell>;

  const PhotoGrid = ({ photos, type, label }: { photos: string[]; type: PhotoType; label: string }) => (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center",
          type === "before" ? "bg-blue-900/50 border border-blue-700" : "bg-green-900/50 border border-green-700")}>
          <Camera size={15} className={type === "before" ? "text-blue-400" : "text-green-400"} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-100">{label}</h2>
          <p className="text-xs text-slate-500">{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((url) => (
          <div key={url} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-700">
            <Image src={url} alt="window" fill className="object-cover" sizes="200px" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button onClick={() => setLightbox(url)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white">
                <ZoomIn size={14} />
              </button>
              <button onClick={() => removePhoto(type, url)} className="w-8 h-8 rounded-full bg-red-500/60 hover:bg-red-500 flex items-center justify-center text-white">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        <label className={clsx("aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-amber-500 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors",
          uploading === type && "opacity-50 pointer-events-none")}>
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => upload(type, e.target.files)} />
          {uploading === type ? (
            <div className="text-xs text-slate-500">Uploading...</div>
          ) : (
            <>
              <Upload size={18} className="text-slate-500" />
              <span className="text-xs text-slate-500">Add</span>
            </>
          )}
        </label>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="mb-2">
        <span className="font-mono text-amber-400 text-xs">{job.jobNumber}</span>
        <h1 className="text-lg font-bold text-slate-100">{job.customer.name || "Unnamed Job"}</h1>
      </div>
      <JobNav jobId={id} />

      <div className="space-y-6">
        <PhotoGrid photos={job.beforePhotos} type="before" label="Before Installation" />
        <PhotoGrid photos={job.afterPhotos} type="after" label="After Installation" />

        {job.beforePhotos.length > 0 && job.afterPhotos.length > 0 && (
          <div className="card">
            <h2 className="section-title">Before / After</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Before", src: job.beforePhotos[0] },
                { label: "After",  src: job.afterPhotos[0] },
              ].map(({ label, src }) => (
                <div key={label}>
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">{label}</div>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 cursor-pointer"
                    onClick={() => setLightbox(src)}>
                    <Image src={src} alt={label} fill className="object-cover" sizes="600px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white z-10"><X size={24} /></button>
          <div className="relative w-full max-w-4xl max-h-[90vh] aspect-video">
            <Image src={lightbox} alt="preview" fill className="object-contain" sizes="1200px" />
          </div>
        </div>
      )}
    </AppShell>
  );
}
