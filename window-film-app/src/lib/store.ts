import { Job } from "./types";

const KEY = "filmflow_jobs";

export function loadJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveJobs(jobs: Job[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(jobs));
}

export function getJob(id: string): Job | undefined {
  return loadJobs().find((j) => j.id === id);
}

export function upsertJob(job: Job) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx === -1) jobs.push(job);
  else jobs[idx] = job;
  saveJobs(jobs);
}

export function removeJob(id: string) {
  saveJobs(loadJobs().filter((j) => j.id !== id));
}

export function nextJobNumber(): string {
  const jobs = loadJobs();
  const max = jobs.reduce((acc, j) => {
    const n = parseInt(j.jobNumber.replace(/\D/g, ""), 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 999);
  return `JOB-${String(max + 1).padStart(4, "0")}`;
}
