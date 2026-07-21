'use client';

import { useEffect, useId, useRef } from 'react';
import { useTheme } from 'next-themes';

type CountryMarker = {
  name: string;
  coords: [number, number];
};

const COUNTRY_COORDS: Record<string, [number, number]> = {
  AF: [33, 67], AL: [41, 20], DZ: [28, 3], AO: [-12, 18], AR: [-34, -64],
  AM: [40, 45], AU: [-25, 134], AT: [47, 14], AZ: [41, 50], BD: [24, 90],
  BY: [53, 28], BE: [51, 4], BO: [-17, -65], BA: [44, 18], BR: [-10, -52],
  BG: [43, 25], CA: [56, -106], CL: [-30, -71], CN: [35, 104], CO: [4, -74],
  HR: [45, 16], CZ: [50, 15], DK: [56, 10], EG: [27, 30], EE: [59, 26],
  FI: [64, 26], FR: [46, 2], GE: [42, 44], DE: [51, 10], GR: [39, 22],
  HU: [47, 20], IN: [21, 79], ID: [-5, 120], IR: [32, 53], IQ: [33, 44],
  IE: [53, -8], IL: [31, 35], IT: [43, 12], JP: [36, 138], KZ: [48, 67],
  KE: [0, 38], KR: [36, 128], LV: [57, 25], LT: [56, 24], MY: [4, 102],
  MX: [23, -102], MD: [47, 29], MN: [47, 104], ME: [43, 19], MA: [32, -5],
  NL: [52, 5], NZ: [-41, 174], NG: [10, 8], NO: [62, 8], PK: [30, 69],
  PE: [-10, -76], PH: [13, 122], PL: [52, 20], PT: [40, -8], RO: [46, 25],
  RU: [60, 100], SA: [24, 45], RS: [44, 21], SG: [1, 104], SK: [49, 19],
  SI: [46, 15], ZA: [-29, 24], ES: [40, -4], SE: [62, 18], CH: [47, 8],
  TH: [15, 101], TR: [39, 35], UA: [49, 32], AE: [24, 54], GB: [54, -3],
  US: [38, -97], UZ: [41, 64], VN: [16, 106],
};

type WorldMapProps = {
  markers?: { code2: string | null; country: string }[];
  className?: string;
};

export function WorldMap({ markers = [], className }: WorldMapProps) {
  const reactId = useId();
  const domId = `jvm-${reactId.replace(/:/g, '')}`;
  const mapRef = useRef<any>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = document.getElementById(domId);
    if (!el) return;

    let cancelled = false;

    (async () => {
      const jsVectorMap = (await import('jsvectormap')).default;
      await import('jsvectormap/dist/maps/world');

      if (cancelled) return;

      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      el.innerHTML = '';

      const isDark = resolvedTheme === 'dark';

      const markerData: CountryMarker[] = markers
        .map((m) => {
          const coords = m.code2 ? COUNTRY_COORDS[m.code2] : null;
          if (!coords) return null;
          return { name: m.country, coords };
        })
        .filter(Boolean) as CountryMarker[];

      mapRef.current = new jsVectorMap({
        selector: `#${domId}`,
        map: 'world',
        backgroundColor: 'transparent',
        draggable: false,
        zoomButtons: false,
        zoomOnScroll: false,
        showTooltip: true,

        regionStyle: {
          initial: {
            fill: isDark ? '#374151' : '#e5e7eb',
            fillOpacity: 1,
            stroke: isDark ? '#1f2937' : '#f3f4f6',
            strokeWidth: 0.5,
          },
          hover: {
            fillOpacity: 0.8,
            cursor: 'default',
          },
        },

        markerStyle: {
          initial: {
            r: 5,
            fill: isDark ? '#60a5fa' : '#3b82f6',
            fillOpacity: 1,
            stroke: isDark ? '#1e3a5f' : '#fff',
            strokeWidth: 3,
            strokeOpacity: 0.6,
          },
          hover: {
            fill: isDark ? '#93c5fd' : '#2563eb',
            cursor: 'pointer',
          },
        },

        markers: markerData,
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [domId, markers, resolvedTheme]);

  return <div id={domId} className={className} style={{ width: '100%', height: '100%' }} />;
}
