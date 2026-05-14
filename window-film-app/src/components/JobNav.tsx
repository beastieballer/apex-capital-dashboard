"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ClipboardList, Ruler, Scissors, FileText, Camera, CreditCard } from "lucide-react";

const tabs = [
  { key: "", icon: ClipboardList, label: "Overview" },
  { key: "measurements", icon: Ruler, label: "Measure" },
  { key: "cutsheet", icon: Scissors, label: "Cut Sheet" },
  { key: "quote", icon: FileText, label: "Quote" },
  { key: "photos", icon: Camera, label: "Photos" },
  { key: "payment", icon: CreditCard, label: "Payment" },
];

export default function JobNav({ jobId }: { jobId: string }) {
  const path = usePathname();
  return (
    <nav className="flex gap-0.5 border-b border-slate-700 mb-6 no-print overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      {tabs.map(({ key, icon: Icon, label }) => {
        const href = `/jobs/${jobId}${key ? `/${key}` : ""}`;
        const active = key === ""
          ? path === `/jobs/${jobId}`
          : path.startsWith(`/jobs/${jobId}/${key}`);
        return (
          <Link key={key} href={href}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              active
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}>
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
