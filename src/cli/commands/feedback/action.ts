import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_FEEDBACK_ENDPOINT,
  FEEDBACK_CATEGORIES,
  FEEDBACK_SURFACES,
  type FeedbackCategory,
  type FeedbackPayload,
  type FeedbackSurface,
} from "../../../shared/feedback-types";

export interface FeedbackOptions {
  category?: string;
  summary?: string;
  description?: string;
  surface?: string;
  endpoint?: string;
  json?: boolean;
  dryRun?: boolean;
}

interface FeedbackResult {
  ok: boolean;
  dryRun: boolean;
  endpoint: string;
  payload: FeedbackPayload;
  status?: number;
  response?: unknown;
  error?: string;
}

function writeJson(value: unknown) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function normalizeRequiredString(value: string | undefined, label: string) {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`feedback requires --${label} <${label}>`);
  }
  return normalized;
}

function parseCategory(value: string | undefined): FeedbackCategory {
  const normalized = normalizeRequiredString(value, "category");
  if (FEEDBACK_CATEGORIES.includes(normalized as FeedbackCategory)) {
    return normalized as FeedbackCategory;
  }

  throw new Error(`--category must be one of: ${FEEDBACK_CATEGORIES.join(", ")}`);
}

function parseSurface(value: string | undefined): FeedbackSurface {
  const normalized = (value ?? "cli").trim();
  if (FEEDBACK_SURFACES.includes(normalized as FeedbackSurface)) {
    return normalized as FeedbackSurface;
  }

  throw new Error(`--surface must be one of: ${FEEDBACK_SURFACES.join(", ")}`);
}

async function readPackageVersion(): Promise<string | undefined> {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const candidates = [
    path.resolve(currentDir, "../../../../package.json"),
    path.resolve(currentDir, "../../package.json"),
  ];

  for (const packagePath of candidates) {
    try {
      const rawPackage = await readFile(packagePath, "utf8");
      const parsed = JSON.parse(rawPackage) as { version?: unknown };
      return typeof parsed.version === "string" ? parsed.version : undefined;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  return undefined;
}

function createOsSummary() {
  return `${os.type()} ${os.release()} ${os.arch()}`;
}

async function postFeedback(
  endpoint: string,
  payload: FeedbackPayload
): Promise<{ status: number; response: unknown }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let responseBody: unknown = text;
  if (text) {
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = text;
    }
  }

  if (!response.ok) {
    const message = typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody);
    throw new Error(`feedback request failed with ${response.status}: ${message}`);
  }

  return { status: response.status, response: responseBody };
}

export async function runFeedback(options: FeedbackOptions) {
  const endpoint = options.endpoint?.trim() || DEFAULT_FEEDBACK_ENDPOINT;
  const packageVersion = await readPackageVersion();
  let payload: FeedbackPayload;

  try {
    payload = {
      surface: parseSurface(options.surface),
      category: parseCategory(options.category),
      summary: normalizeRequiredString(options.summary, "summary"),
      description: normalizeRequiredString(options.description, "description"),
      appVersion: packageVersion,
      cliVersion: packageVersion,
      nodeVersion: process.version,
      os: createOsSummary(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    writeJson({
      ok: false,
      dryRun: Boolean(options.dryRun),
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exitCode = 1;
    return;
  }

  if (options.dryRun) {
    writeJson({ ok: true, dryRun: true, endpoint, payload } satisfies FeedbackResult);
    return;
  }

  try {
    const sent = await postFeedback(endpoint, payload);
    writeJson({
      ok: true,
      dryRun: false,
      endpoint,
      payload,
      status: sent.status,
      response: sent.response,
    } satisfies FeedbackResult);
  } catch (error) {
    writeJson({
      ok: false,
      dryRun: false,
      endpoint,
      payload,
      error: error instanceof Error ? error.message : String(error),
    } satisfies FeedbackResult);
    process.exitCode = 1;
  }
}
