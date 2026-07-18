"use client";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";

export function NigeriaLocationFields({ state, city, onStateChange, onCityChange }: { state: string; city: string; onStateChange: (value: string) => void; onCityChange: (value: string) => void }) {
  const id = useId(); const [states, setStates] = useState<string[]>([]); const [cities, setCities] = useState<string[]>([]);
  useEffect(() => { fetch("/api/locations/nigeria").then(r => r.json()).then(p => setStates(p.data ?? [])).catch(() => setStates([])); }, []);
  useEffect(() => { if (!state) return; fetch(`/api/locations/nigeria?state=${encodeURIComponent(state)}`).then(r => r.json()).then(p => setCities(p.data ?? [])).catch(() => setCities([])); }, [state]);
  const visibleCities = state ? cities : [];
  return <>
    <Input value="Nigeria" readOnly aria-label="Country" className="h-11 rounded-xl bg-muted" />
    <><Input list={`${id}-states`} value={state} onChange={e => { onStateChange(e.target.value); onCityChange(""); }} placeholder="Search state" className="h-11 rounded-xl" /><datalist id={`${id}-states`}>{states.map(item => <option key={item} value={item} />)}</datalist></>
    <><Input list={`${id}-cities`} value={city} onChange={e => onCityChange(e.target.value)} disabled={!state} placeholder={state ? "Search city" : "Select a state first"} className="h-11 rounded-xl" /><datalist id={`${id}-cities`}>{visibleCities.map(item => <option key={item} value={item} />)}</datalist></>
  </>;
}
