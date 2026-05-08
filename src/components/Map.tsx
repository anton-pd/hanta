"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { CasePoint } from "@/lib/api/types";

interface MapProps {
  points: CasePoint[];
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export default function HantaMap({ points }: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1.4,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      const fc = {
        type: "FeatureCollection" as const,
        features: points.map((p) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] as [number, number] },
          properties: {
            country: p.country_iso2,
            locality: p.locality ?? p.region ?? "",
            cases: p.cases_confirmed,
            deaths: p.deaths,
            confidence: p.confidence,
            date: p.report_date,
          },
        })),
      };
      map.addSource("events", { type: "geojson", data: fc });

      map.addLayer({
        id: "events-heat",
        type: "heatmap",
        source: "events",
        maxzoom: 6,
        paint: {
          "heatmap-weight": [
            "interpolate", ["linear"], ["+", ["get", "cases"], ["*", 2, ["get", "deaths"]]],
            0, 0, 20, 1,
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.6, 6, 1.4],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgba(255,200,80,0.5)",
            0.5, "rgba(255,120,40,0.7)",
            1, "rgba(220,30,30,0.9)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 14, 6, 28],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 6, 0.5],
        },
      });

      map.addLayer({
        id: "events-points",
        type: "circle",
        source: "events",
        minzoom: 3,
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["+", ["get", "cases"], ["*", 2, ["get", "deaths"]]],
            0, 4, 5, 8, 20, 16,
          ],
          "circle-color": [
            "case",
            [">", ["get", "deaths"], 0], "#dc2626",
            ["==", ["get", "cases"], 0], "#facc15",
            "#f97316",
          ],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.85,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, offset: 8 });
      map.on("mouseenter", "events-points", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const p = f.properties as Record<string, unknown>;
        popup
          .setLngLat(f.geometry.coordinates as [number, number])
          .setHTML(
            `<div style="font:13px ui-sans-serif,system-ui;line-height:1.4">
              <strong>${String(p.country)}${p.locality ? ` — ${String(p.locality)}` : ""}</strong><br/>
              ${Number(p.cases)} confirmed · ${Number(p.deaths)} deaths<br/>
              <span style="color:#6b7280">${String(p.date)} · conf ${Number(p.confidence).toFixed(2)}</span>
            </div>`,
          )
          .addTo(map);
      });
      map.on("mouseleave", "events-points", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return <div ref={ref} className="h-[420px] w-full rounded-lg border bg-muted" />;
}
