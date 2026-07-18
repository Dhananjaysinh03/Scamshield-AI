import { randomBytes } from "crypto";
import type {
  HoneypotStartRequest,
  HoneypotStartResponse,
  HoneypotStatusResponse,
  RiskLevel,
} from "./types";

type Job = {
  jobId: string;
  targetUrl: string;
  mode: "simulated" | "live_sink";
  status: "running" | "done" | "error";
  injected: number;
  cap: number;
  lines: string[];
  lastProfilePreview?: string;
  createdAt: number;
  timer?: ReturnType<typeof setInterval>;
};

const jobs = new Map<string, Job>();
const JOB_TTL_MS = 5 * 60 * 1000;

const FIRST = [
  "Aarav",
  "Diya",
  "Rohan",
  "Priya",
  "Kabir",
  "Ananya",
  "Vikram",
  "Meera",
  "Arjun",
  "Sana",
  "Noah",
  "Elena",
];
const LAST = [
  "Sharma",
  "Patel",
  "Singh",
  "Iyer",
  "Khan",
  "Reddy",
  "Nair",
  "Das",
  "Garcia",
  "Brooks",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randAlnum(len: number): string {
  return randomBytes(len).toString("base64url").slice(0, len);
}

export function synthesizeProfile(): {
  name: string;
  email: string;
  password: string;
  routing: string;
  userAgent: string;
} {
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}.${randAlnum(4)}@mail-temp.net`;
  const password = `${randAlnum(3)}${pick(["!", "@", "#"])}${randAlnum(5)}${Math.floor(Math.random() * 90 + 10)}`;
  const routing = `${Math.floor(100000000 + Math.random() * 899999999)}`;
  const userAgent = pick([
    "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/125.0 Mobile",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0",
  ]);
  return { name, email, password, routing, userAgent };
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > JOB_TTL_MS) {
      if (job.timer) clearInterval(job.timer);
      jobs.delete(id);
    }
  }
}

function allowedRisk(level: RiskLevel): boolean {
  return level === "high" || level === "critical";
}

export function startHoneypot(
  req: HoneypotStartRequest,
): HoneypotStartResponse | { error: string; status: number } {
  purgeExpired();

  if (!req.targetUrl?.trim()) {
    return { error: "targetUrl required", status: 400 };
  }
  if (!allowedRisk(req.riskLevel)) {
    return {
      error: "Honeypot unlocks only for high or critical risk",
      status: 403,
    };
  }

  const intensity = req.intensity ?? "demo";
  const cap = intensity === "burst" ? 2000 : 1420;
  const tickMs = intensity === "burst" ? 40 : 70;
  const jobId = `hp_${randAlnum(12)}`;

  const job: Job = {
    jobId,
    targetUrl: req.targetUrl.trim(),
    mode: "simulated",
    status: "running",
    injected: 0,
    cap,
    lines: [
      `[Honeypot Active]: Simulated blast armed against ${req.targetUrl.trim()}`,
      `[Honeypot Active]: Mode=simulated intensity=${intensity} - no live third-party POSTs`,
    ],
    createdAt: Date.now(),
  };

  job.timer = setInterval(() => {
    if (job.status !== "running") return;

    const batch = 5 + Math.floor(Math.random() * 19);
    for (let i = 0; i < batch && job.injected < job.cap; i++) {
      const profile = synthesizeProfile();
      job.injected += 1;
      job.lastProfilePreview = `${profile.name} <${profile.email}> routing=${profile.routing}`;
    }

    if (job.injected % 50 < batch || job.injected >= job.cap) {
      job.lines.push(
        `[Honeypot Active]: Injected ${job.injected.toLocaleString()} fake credentials…`,
      );
      if (job.lastProfilePreview) {
        job.lines.push(`[Honeypot Active]: Profile seed ${job.lastProfilePreview}`);
      }
      // Keep line buffer bounded
      if (job.lines.length > 80) {
        job.lines = job.lines.slice(-60);
      }
    }

    if (job.injected >= job.cap) {
      job.status = "done";
      job.lines.push(
        `[Honeypot Active]: Injected ${job.injected.toLocaleString()} fake credentials. Scammer database corrupted successfully.`,
      );
      if (job.timer) clearInterval(job.timer);
      job.timer = undefined;
    }
  }, tickMs);

  jobs.set(jobId, job);

  return {
    jobId,
    mode: "simulated",
    status: "running",
  };
}

export function getHoneypotStatus(jobId: string): HoneypotStatusResponse | null {
  purgeExpired();
  const job = jobs.get(jobId);
  if (!job) return null;

  return {
    jobId: job.jobId,
    injected: job.injected,
    status: job.status,
    lastProfilePreview: job.lastProfilePreview,
    lines: [...job.lines],
  };
}

export function stopHoneypot(jobId: string): boolean {
  const job = jobs.get(jobId);
  if (!job) return false;
  if (job.timer) clearInterval(job.timer);
  job.timer = undefined;
  if (job.status === "running") {
    job.status = "done";
    job.lines.push(
      `[Honeypot Active]: Stopped at ${job.injected.toLocaleString()} injections.`,
    );
  }
  return true;
}
