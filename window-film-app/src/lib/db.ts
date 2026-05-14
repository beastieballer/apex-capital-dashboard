import fs from "fs";
import path from "path";
import { Job } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJobs(): Job[] {
  ensureDataDir();
  if (!fs.existsSync(JOBS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(JOBS_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeJobs(jobs: Job[]) {
  ensureDataDir();
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

export function getAllJobs(): Job[] {
  return readJobs().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getJob(id: string): Job | null {
  return readJobs().find((j) => j.id === id) ?? null;
}

export function createJob(job: Job): Job {
  const jobs = readJobs();
  jobs.push(job);
  writeJobs(jobs);
  return job;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const jobs = readJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;
  jobs[idx] = { ...jobs[idx], ...updates, updatedAt: new Date().toISOString() };
  writeJobs(jobs);
  return jobs[idx];
}

export function deleteJob(id: string): boolean {
  const jobs = readJobs();
  const filtered = jobs.filter((j) => j.id !== id);
  if (filtered.length === jobs.length) return false;
  writeJobs(filtered);
  return true;
}

export function nextJobNumber(): string {
  const jobs = readJobs();
  const max = jobs.reduce((acc, j) => {
    const n = parseInt(j.jobNumber.replace(/\D/g, ""), 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 999);
  return `JOB-${String(max + 1).padStart(4, "0")}`;
}
