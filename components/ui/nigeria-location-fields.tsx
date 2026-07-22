"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ComboboxField } from "@/components/ui/combobox-field";

export function NigeriaLocationFields({ state, city, onStateChange, onCityChange }: { state: string; city: string; onStateChange: (value: string) => void; onCityChange: (value: string) => void }) {
  const [states, setStates] = useState<string[]>([]); const [cities, setCities] = useState<string[]>([]);
  useEffect(() => { fetch("/api/locations/nigeria").then(r => r.json()).then(p => setStates(p.data ?? [])).catch(() => setStates([])); }, []);
  useEffect(() => { if (!state) return; fetch(`/api/locations/nigeria?state=${encodeURIComponent(state)}`).then(r => r.json()).then(p => setCities(p.data ?? [])).catch(() => setCities([])); }, [state]);
  const visibleCities = state ? cities : [];
  return <>
    <Input value="Nigeria" readOnly aria-label="Country" className="h-11 rounded-xl bg-muted" />
    <ComboboxField value={state} onValueChange={value => { onStateChange(value); onCityChange(""); }} options={states.map(value => ({ value, label: value }))} placeholder="Search state" className="h-11 rounded-xl" />
    <ComboboxField value={city} onValueChange={onCityChange} options={visibleCities.map(value => ({ value, label: value }))} disabled={!state} placeholder={state ? "Search city" : "Select a state first"} className="h-11 rounded-xl" />
  </>;
}
