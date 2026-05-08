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
      center: [10, 25],
      zoom: 1.6,
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
            severity: p.cases_confirmed + 2 * p.deaths,
          },
        })),
      };
      map.addSource("events", { type: "geojson", data: fc });

      // Heat layer — visible at low zoom for global overview
      map.addLayer({
        id: "events-heat",
        type: "heatmap",
        source: "events",
        maxzoom: 5,
        paint: {
          "heatmap-weight": [
            "interpolate", ["linear"], ["get", "severity"],
            0, 0.2, 5, 0.6, 20, 1,
          ],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 2],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.15, "rgba(255,206,84,0.45)",
            0.45, "rgba(255,140,40,0.75)",
            0.85, "rgba(220,30,30,0.95)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 28, 5, 60],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 5, 0.5],
        },
      });

      // Outer halo ring for visibility
      map.addLayer({
        id: "events-halo",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "severity"],
            0, 14, 5, 22, 20, 36,
          ],
          "circle-color": [
            "case", [">", ["get", "deaths"], 0], "#dc2626", "#f59e0b",
          ],
          "circle-opacity": 0.18,
          "circle-blur": 0.6,
        },
      });

      // Solid marker
      map.addLayer({
        id: "events-points",
        type: "circle",
        source: "events",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "severity"],
            0, 6, 5, 9, 20, 16,
          ],
          "circle-color": [
            "case",
            [">", ["get", "deaths"], 0], "#dc2626",
            ["==", ["get", "cases"], 0], "#facc15",
            "#f59e0b",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0f172a",
          "circle-opacity": 0.95,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, offset: 10, className: "hanta-popup" });
      const showPopup = (e: maplibregl.MapLayerMouseEvent) => {
        map.getCanvas().style.cursor = "pointer";
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const p = f.properties as Record<string, unknown>;
        popup
          .setLngLat(f.geometry.coordinates as [number, number])
          .setHTML(
            `<div style="font:12px ui-sans-serif,system-ui;line-height:1.5;color:#fafafa">
              <div style="font-weight:600;letter-spacing:-.01em">${String(p.country)}${p.locality ? ` · ${String(p.locality)}` : ""}</div>
              <div style="margin-top:4px">
                <span style="color:#fbbf24">${Number(p.cases)} confirmed</span>${Number(p.deaths) > 0 ? ` · <span style="color:#f87171">${Number(p.deaths)} deaths</span>` : ""}
              </div>
              <div style="margin-top:2px;color:#94a3b8;font-size:11px">${String(p.date)} · confidence ${Number(p.confidence).toFixed(2)}</div>
            </div>`,
          )
          .addTo(map);
      };
      map.on("mouseenter", "events-points", showPopup);
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

  return (
    <div className="relative">
      <div
        ref={ref}
        className="h-[460px] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted md:h-[560px]"
      />
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-lg border border-border/60 bg-card/85 px-3 py-2 text-[11px] backdrop-blur">
        <span className="uppercase tracking-wider text-muted-foreground">Severity</span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" /> Suspected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Deaths
        </span>
      </div>
      <style>{`
        .hanta-popup .maplibregl-popup-content {
          background: oklch(0.21 0.014 250);
          border: 1px solid oklch(1 0 0 / 0.10);
          border-radius: 8px;
          padding: 10px 12px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        }
        .hanta-popup .maplibregl-popup-tip { display: none; }
      `}</style>
    </div>
  );
}
