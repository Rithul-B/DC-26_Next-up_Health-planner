import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Place = {
  id: string;
  name: string;
  kind: "hospital" | "pharmacy";
  lat: number;
  lon: number;
  address?: string;
  mapsUrl: string;
  osmUrl: string;
};

function osmUrl(lat: number, lon: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}

function routingUrl(lat: number, lon: number) {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lon}`;
}

const UA = "NextUp/1.0 (inclusive health planner; educational; +https://localhost)";

async function overpassAround(lat: number, lon: number): Promise<Place[]> {
  const query = `[out:json][timeout:20];(node["amenity"="hospital"](around:4000,${lat},${lon});way["amenity"="hospital"](around:4000,${lat},${lon});node["amenity"="pharmacy"](around:4000,${lat},${lon});way["amenity"="pharmacy"](around:4000,${lat},${lon}););out center 30;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": UA },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error("overpass");
  const data = (await res.json()) as {
    elements?: {
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: { name?: string; amenity?: string; "addr:full"?: string; "addr:street"?: string };
    }[];
  };
  const places: Place[] = [];
  for (const el of data.elements ?? []) {
    const plat = el.lat ?? el.center?.lat;
    const plon = el.lon ?? el.center?.lon;
    const amenity = el.tags?.amenity;
    if (plat == null || plon == null) continue;
    if (amenity !== "hospital" && amenity !== "pharmacy") continue;
    const name = el.tags?.name || (amenity === "hospital" ? "Hospital" : "Pharmacy");
    places.push({
      id: `${el.type}/${el.id}`,
      name,
      kind: amenity,
      lat: plat,
      lon: plon,
      address: el.tags?.["addr:full"] || el.tags?.["addr:street"],
      mapsUrl: routingUrl(plat, plon),
      osmUrl: osmUrl(plat, plon),
    });
  }
  return places.slice(0, 24);
}

async function nominatimSearch(q: string): Promise<Place[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "20");
  url.searchParams.set("addressdetails", "1");
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error("nominatim");
  const data = (await res.json()) as {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    type?: string;
    class?: string;
    name?: string;
  }[];
  return data.map((row) => {
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    const blob = `${row.type ?? ""} ${row.class ?? ""} ${row.display_name}`.toLowerCase();
    const kind: Place["kind"] = blob.includes("pharmacy") || blob.includes("chemist")
      ? "pharmacy"
      : "hospital";
    const name = row.name || row.display_name.split(",")[0] || "Place";
    return {
      id: String(row.place_id),
      name,
      kind,
      lat,
      lon,
      address: row.display_name,
      mapsUrl: routingUrl(lat, lon),
      osmUrl: osmUrl(lat, lon),
    };
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const city = url.searchParams.get("city")?.trim() ?? "";

  try {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const places = await overpassAround(lat, lon);
      return NextResponse.json({
        ok: true,
        source: "overpass",
        places,
        routingHint: "Open a place to get walking or driving directions in OpenStreetMap.",
      });
    }
    if (city) {
      const hospitals = await nominatimSearch(`hospital in ${city}`);
      const pharmacies = await nominatimSearch(`pharmacy in ${city}`);
      const places = [...hospitals, ...pharmacies].slice(0, 24);
      return NextResponse.json({
        ok: true,
        source: "nominatim",
        places,
      });
    }
    return NextResponse.json(
      { error: "Share a location, or type a city name." },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "The map search did not answer. Try again in a minute, or type a city name.",
      },
      { status: 502 },
    );
  }
}
