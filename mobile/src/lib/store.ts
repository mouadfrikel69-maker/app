import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import type { AppState, MoneyEntry, Worker } from "./types";

const STORAGE_KEY = "ceramic-manager-mobile-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaults(): AppState {
  return {
    workers: [
      { id: uid(), name: "Otman", rate: 130 },
      { id: uid(), name: "Azzeddin", rate: 200 },
    ],
    categories: ["Mouad", "Ahmed", "Otman", "Azzeddin", "Gaz", "Breakfast", "Other"],
    attendance: {},
    moneyIn: [],
    moneyOut: [],
    advances: [],
  };
}

export function fmtISO(d: Date) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function startOfWeek(offset: number) {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  d.setDate(d.getDate() - day + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekDates(offset: number) {
  const start = startOfWeek(offset);
  return DAYS.map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function fmtDay(d: Date) {
  return String(d.getDate()).padStart(2, "0");
}

export function fmtMonthYear(d: Date) {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function dh(n: number) {
  return Number(n).toLocaleString("fr-MA") + " DH";
}

export function weekDaysWorked(state: AppState, workerId: string, offset: number) {
  const today = fmtISO(new Date());
  let count = 0;
  let future = 0;
  weekDates(offset).forEach((d) => {
    const iso = fmtISO(d);
    if (state.attendance[workerId + "|" + iso] === "in") count++;
    if (iso > today) future++;
  });
  return { count, future };
}

export function advancesFor(state: AppState, workerId: string) {
  return state.advances.filter((a) => a.workerId === workerId);
}

export function useAppState(): {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  ready: boolean;
} {
  const [state, setState] = useState<AppState>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const s = JSON.parse(raw);
          const d = defaults();
          setState({
            workers: s.workers || d.workers,
            categories: s.categories || d.categories,
            attendance: s.attendance || {},
            moneyIn: s.moneyIn || [],
            moneyOut: s.moneyOut || [],
            advances: s.advances || [],
          });
        }
      } catch {
        // corrupted data: keep defaults
      }
      setReady(true);
    })();
  }, []);

  const update = (fn: (s: AppState) => AppState) => {
    setState((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return { state, update, ready };
}

export function addWorker(s: AppState, name: string, rate: number): AppState {
  return { ...s, workers: [...s.workers, { id: uid(), name, rate: rate || 130 }] };
}

export function removeWorker(s: AppState, id: string): AppState {
  return { ...s, workers: s.workers.filter((w) => w.id !== id) };
}

export function cycleAttendance(s: AppState, workerId: string, iso: string): AppState {
  const key = workerId + "|" + iso;
  const attendance = { ...s.attendance };
  if (attendance[key] === "in") attendance[key] = "out";
  else if (attendance[key] === "out") delete attendance[key];
  else attendance[key] = "in";
  return { ...s, attendance };
}

export function setRate(s: AppState, id: string, rate: number): AppState {
  return {
    ...s,
    workers: s.workers.map((w) => (w.id === id ? { ...w, rate } : w)),
  };
}

export function addAdvance(s: AppState, workerId: string, amount: number): AppState {
  return {
    ...s,
    advances: [...s.advances, { id: uid(), workerId, amount, date: fmtISO(new Date()) }],
  };
}

export function removeAdvance(s: AppState, id: string): AppState {
  return { ...s, advances: s.advances.filter((a) => a.id !== id) };
}

export function addMoneyIn(s: AppState, amount: number, note: string): AppState {
  const entry: MoneyEntry = { id: uid(), amount, note, date: fmtISO(new Date()) };
  return { ...s, moneyIn: [...s.moneyIn, entry] };
}

export function addMoneyOut(
  s: AppState,
  amount: number,
  category: string,
  note: string
): AppState {
  const entry: MoneyEntry = { id: uid(), amount, category, note, date: fmtISO(new Date()) };
  return { ...s, moneyOut: [...s.moneyOut, entry] };
}

export function deleteEntry(s: AppState, kind: "in" | "out", id: string): AppState {
  if (kind === "in") return { ...s, moneyIn: s.moneyIn.filter((e) => e.id !== id) };
  return { ...s, moneyOut: s.moneyOut.filter((e) => e.id !== id) };
}

export function addCategory(s: AppState, name: string): AppState {
  if (s.categories.some((c) => c.toLowerCase() === name.toLowerCase())) return s;
  return { ...s, categories: [...s.categories, name] };
}

export function removeCategory(s: AppState, name: string): AppState {
  return { ...s, categories: s.categories.filter((c) => c !== name) };
}
