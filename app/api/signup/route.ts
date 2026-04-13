import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

const DATA_PATH = join("/tmp", "signups.json");
const MAX_EMAIL_LENGTH = 254;

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  if (email.includes("..")) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain || local.length > 64) return false;
  if (domain.startsWith(".") || domain.endsWith(".")) return false;
  if (!domain.includes(".")) return false;

  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(email);
}

function normalizeStoredSignups(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const emails: string[] = [];

  value.forEach((item) => {
    const email = normalizeEmail(item);
    if (!isValidEmail(email) || seen.has(email)) return;
    seen.add(email);
    emails.push(email);
  });

  return emails;
}

function getSignups(): string[] {
  if (!existsSync(DATA_PATH)) return [];

  try {
    const parsed = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    return normalizeStoredSignups(parsed);
  } catch {
    return [];
  }
}

function saveSignups(emails: string[]) {
  writeFileSync(DATA_PATH, JSON.stringify(emails, null, 2));
}

export async function GET() {
  return NextResponse.json({ ok: true, count: getSignups().length });
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not read that signup. Try again." },
      { status: 400 }
    );
  }

  const email = normalizeEmail(
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email?: unknown }).email
      : ""
  );

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const signups = getSignups();
  const existingIndex = signups.indexOf(email);

  if (existingIndex >= 0) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      email,
      count: signups.length,
      position: existingIndex + 1,
      message: "You're already on the waitlist.",
    });
  }

  signups.push(email);

  try {
    saveSignups(signups);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not save your spot locally. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      duplicate: false,
      email,
      count: signups.length,
      position: signups.length,
      message: "You're on the waitlist.",
    },
    { status: 201 }
  );
}
