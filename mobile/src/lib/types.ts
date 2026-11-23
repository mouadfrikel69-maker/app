export type Worker = { id: string; name: string; rate: number };
export type Advance = { id: string; workerId: string; amount: number; date: string };
export type MoneyEntry = {
  id: string;
  amount: number;
  note?: string;
  category?: string;
  date: string;
};
export type AppState = {
  workers: Worker[];
  categories: string[];
  attendance: Record<string, "in" | "out">;
  moneyIn: MoneyEntry[];
  moneyOut: MoneyEntry[];
  advances: Advance[];
};
