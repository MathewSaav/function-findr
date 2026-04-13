import { NextRequest } from "next/server";

const CENTER = { lat: 37.335, lng: -121.893 };
const ZOOM = 14;
const MAX_SIZE = 1280;
const MIN_SIZE = 320;

function readDimension(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, parsed));
}

export async function GET(request: NextRequest) {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.MAPBOX_TOKEN ||
    process.env.MAPBOX_API_KEY ||
    "";

  if (!token) {
    return new Response("Mapbox token is not configured.", { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const width = readDimension(searchParams.get("width"), 640);
  const height = readDimension(searchParams.get("height"), 640);
  const center = `${CENTER.lng},${CENTER.lat},${ZOOM},0`;
  const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${center}/${width}x${height}@2x?access_token=${encodeURIComponent(token)}`;
  const requestOrigin = new URL(request.url).origin;
  const referer = request.headers.get("referer") || `${requestOrigin}/map`;

  const response = await fetch(mapboxUrl, {
    cache: "no-store",
    headers: {
      Origin: request.headers.get("origin") || requestOrigin,
      Referer: referer,
    },
  });

  if (!response.ok) {
    return new Response("Mapbox image could not be loaded.", { status: response.status });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": response.headers.get("content-type") || "image/png",
    },
  });
}
