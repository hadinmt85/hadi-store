"use client";

import { useMemo, useState } from "react";
import { faNumber } from "@/lib/format";

const STEP = 100_000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function PriceRangeSlider({
  lowerBound,
  upperBound,
  initialMin,
  initialMax,
}: {
  lowerBound: number;
  upperBound: number;
  initialMin?: string;
  initialMax?: string;
}) {
  const bounds = useMemo(() => {
    const min = Math.max(0, Math.floor(lowerBound / STEP) * STEP);
    const max = Math.max(min + STEP, Math.ceil(upperBound / STEP) * STEP);
    return { min, max };
  }, [lowerBound, upperBound]);

  const [valueMin, setValueMin] = useState(() => {
    const parsed = Number(initialMin);
    if (!Number.isFinite(parsed)) return bounds.min;
    const rounded = Math.round(parsed / STEP) * STEP;
    return clamp(rounded, bounds.min, bounds.max - STEP);
  });
  const [valueMax, setValueMax] = useState(() => {
    const parsed = Number(initialMax);
    const fallback = bounds.max;
    const rounded = Number.isFinite(parsed) ? Math.round(parsed / STEP) * STEP : fallback;
    const value = clamp(rounded, bounds.min + STEP, bounds.max);
    return Math.max(value, valueMin + STEP);
  });

  const span = bounds.max - bounds.min;
  const minPercent = ((valueMin - bounds.min) / span) * 100;
  const maxPercent = ((valueMax - bounds.min) / span) * 100;

  const handleMin = (next: number) => {
    setValueMin(Math.min(clamp(next, bounds.min, bounds.max - STEP), valueMax - STEP));
  };

  const handleMax = (next: number) => {
    setValueMax(Math.max(clamp(next, bounds.min + STEP, bounds.max), valueMin + STEP));
  };

  return (
    <div className="mt-2">
      <div className="price-range" dir="rtl">
        <div className="price-range__track" aria-hidden />
        <div
          className="price-range__fill"
          style={{ left: `${100 - maxPercent}%`, width: `${maxPercent - minPercent}%` }}
          aria-hidden
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={STEP}
          value={valueMin}
          onChange={(event) => handleMin(Number(event.target.value))}
          aria-label="حداقل قیمت"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={STEP}
          value={valueMax}
          onChange={(event) => handleMax(Number(event.target.value))}
          aria-label="حداکثر قیمت"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-ink-soft">
        <span>
          از <b className="font-black text-coral">{faNumber(valueMin)}</b>{" "}
          <span className="text-mute">تومان</span>
        </span>
        <span>
          تا <b className="font-black text-coral">{faNumber(valueMax)}</b>{" "}
          <span className="text-mute">تومان</span>
        </span>
      </div>

      <input type="hidden" name="min" value={valueMin > bounds.min ? valueMin : ""} />
      <input type="hidden" name="max" value={valueMax < bounds.max ? valueMax : ""} />
    </div>
  );
}
