import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_PATH = join(process.cwd(), "signups.json");

function getSignups(): string[] {
  if (!existsSync(DATA_PATH)) return [];
  try { return JSON.parse(readFileSync(DATA_PATH, "utf-8")); } catch { return []; }
}

function saveSignups(emails: string[]) {
  writeFileSync(DATA_PATH, JSON.stringify(emails, null, 2));
}

export async function GET() {
  return NextResponse.json({ count: getSignups().length });
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }
  const signups = getSignups();
  if (!signups.includes(email.toLowerCase())) {
    signups.push(email.toLowerCase());
    saveSignups(signups);
  }
  return NextResponse.json({ ok: true, count: signups.length });
}
