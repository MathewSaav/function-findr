"use client";

let sdk: any = null;

export async function getWhopSdk() {
  if (typeof window === "undefined") return null;
  if (sdk) return sdk;
  try {
    const { createSdk } = await import("@whop/iframe");
    sdk = createSdk({ appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || "" });
    return sdk;
  } catch {
    return null;
  }
}

export async function openUrl(url: string) {
  const s = await getWhopSdk();
  if (s) s.openExternalUrl({ url });
  else window.open(url, "_blank");
}
