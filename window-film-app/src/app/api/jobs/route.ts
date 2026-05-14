import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAllJobs, createJob, nextJobNumber } from "@/lib/db";
import type { Job } from "@/lib/types";

export async function GET() {
  return NextResponse.json(getAllJobs());
}

export async function POST(req: Request) {
  const body = await req.json();
  const now = new Date().toISOString();
  const job: Job = {
    id: uuidv4(),
    jobNumber: nextJobNumber(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
    customer: body.customer ?? { name: "", email: "", phone: "", address: "", city: "", state: "", zip: "" },
    description: body.description ?? "",
    location: body.location ?? "residential",
    materialWidth: body.materialWidth ?? 60,
    defaultFilmType: body.defaultFilmType ?? "Solar Control",
    pricePerSqFt: body.pricePerSqFt ?? 8,
    laborRate: body.laborRate ?? 65,
    laborHours: body.laborHours ?? 0,
    taxRate: body.taxRate ?? 0,
    discount: body.discount ?? 0,
    windows: [],
    beforePhotos: [],
    afterPhotos: [],
    payments: [],
    notes: "",
  };
  return NextResponse.json(createJob(job), { status: 201 });
}
