import type {
  HoneypotStartResponse,
  HoneypotStatusResponse,
  RiskLevel,
} from "@/lib/types";

type MockJob = {
  jobId: string;
  injected: number;
  status: "running" | "done" | "error";
  targetUrl: string;
  cap: number;
};

const jobs = new Map<string, MockJob>();

const PREVIEWS = [
  "priya.nair.x7k2@mail-temp.net",
  "kabir.singh.a9m1@mail-temp.net",
  "elena.brooks.q3w8@mail-temp.net",
  "arjun.patel.v2n4@mail-temp.net",
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Client-side honeypot mock — ticks injected by 7–23 each poll, caps ~1420. */
export function mockStartHoneypot(opts: {
  targetUrl: string;
  riskLevel: RiskLevel;
}): HoneypotStartResponse {
  const jobId = `mock-hp-${crypto.randomUUID().slice(0, 8)}`;
  jobs.set(jobId, {
    jobId,
    injected: 0,
    status: "running",
    targetUrl: opts.targetUrl,
    cap: 1420,
  });
  return { jobId, mode: "simulated", status: "running" };
}

export function mockPollHoneypot(jobId: string): HoneypotStatusResponse {
  const job = jobs.get(jobId);
  if (!job) {
    return {
      jobId,
      injected: 0,
      status: "error",
      lines: ["[Honeypot Active]: Unknown job — restart dismantle."],
    };
  }

  if (job.status === "done") {
    return {
      jobId,
      injected: job.injected,
      status: "done",
      lastProfilePreview: PREVIEWS[job.injected % PREVIEWS.length],
      lines: [],
    };
  }

  const delta = rand(7, 23);
  job.injected = Math.min(job.cap, job.injected + delta);
  const preview = PREVIEWS[job.injected % PREVIEWS.length];
  const lines = [
    `[Honeypot Active]: +${delta} profiles → ${job.injected} injected (${preview})`,
  ];

  if (job.injected >= job.cap) {
    job.status = "done";
    lines.push(
      `[Honeypot Active]: Injected ${job.injected} fake credentials. Scammer database corrupted successfully.`,
    );
  }

  return {
    jobId,
    injected: job.injected,
    status: job.status,
    lastProfilePreview: preview,
    lines,
  };
}

export function mockStopHoneypot(jobId: string) {
  const job = jobs.get(jobId);
  if (job && job.status === "running") {
    job.status = "done";
  }
}
