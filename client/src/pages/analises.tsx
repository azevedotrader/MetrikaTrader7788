import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ─── helpers ────────────────────────────────────────────────────────────────
const pnl = (t: any) => parseFloat(t.resultado || "0");

const rVal = (t: any): number | null => {
  const r = parseFloat(t.risco || "0");
  return r > 0 ? parseFloat(t.resultado || "0") / r : null;
};

const fmt = (money: number, r: number | null, mode: "money" | "r"): string => {
  if (mode === "r") {
    return r !== null
      ? `${r >= 0 ? "+" : ""}${r.toFixed(1)}R`
      : `${money >= 0 ? "+" : ""}R$${Math.abs(money).toFixed(0)}`;
  }
  return `${money >= 0 ? "+R$" : "-R$"}${Math.abs(money).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  })}`;
};

// ─── types ───────────────────────────────────────────────────────────────────
interface HourGroup {
  label: string;
  totalMoney: number;
  totalR: number | null;
  rPos: number;
  rNeg: number;
  count: number;
  wr: number;
}

interface DowGroup {
  label: string;
  totalMoney: number;
  totalR: number | null;
  rPos: number;
  rNeg: number;
  count: number;
  wr: number;
}

interface AtivoGroup {
  lbl: string;
  totalMoney: number;
  totalR: number;
  rPos: number;
  rNeg: number;
  wins: number;
  losses: number;
  count: number;
  wr: number;
}

// ─── bar row component ────────────────────────────────────────────────────────
function BarRow({
  label,
  totalMoney,
  totalR,
  rPos,
  rNeg,
  wr,
  maxAbs,
  displayMode,
}: {
  label: string;
  totalMoney: number;
  totalR: number | null;
  rPos: number;
  rNeg: number;
  wr: number;
  maxAbs: number;
  displayMode: "money" | "r";
}) {
  const pct = maxAbs > 0 ? Math.min(100, (Math.abs(totalMoney) / maxAbs) * 100) : 0;
  const displayedValue = fmt(totalMoney, totalR, displayMode);

  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] text-gray-400 w-10 shrink-0">{label}</div>
      <div className="flex-1 bg-[#1a1a2e] rounded h-4 overflow-hidden">
        <div
          className={`h-full rounded ${totalMoney >= 0 ? "bg-[#6EE000]" : "bg-[#FF1F3D]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div
        className={`text-[11px] font-bold w-20 text-right ${
          totalMoney >= 0 ? "text-[#6EE000]" : "text-[#FF1F3D]"
        }`}
      >
        {displayedValue}
      </div>
      <div className="text-[10px] text-gray-600 w-12 text-right">{wr.toFixed(1)}%</div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Analises() {
  const [displayMode, setDisplayMode] = useState<"money" | "r">("money");

  const { data: trades = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/trades"],
  });

  // ── Section A: hours ───────────────────────────────────────────────────────
  const hourMap = new Map<number, { money: number; rPos: number; rNeg: number; count: number; rSum: number; rCount: number }>();
  trades.forEach((t) => {
    const h = new Date(t.dataHora).getHours();
    if (!hourMap.has(h)) hourMap.set(h, { money: 0, rPos: 0, rNeg: 0, count: 0, rSum: 0, rCount: 0 });
    const g = hourMap.get(h)!;
    const money = pnl(t);
    const rv = rVal(t);
    g.money += money;
    g.count++;
    if (money > 0) g.rPos += money;
    if (money < 0) g.rNeg += Math.abs(money);
    if (rv !== null) { g.rSum += rv; g.rCount++; }
  });

  const hourList: HourGroup[] = Array.from(hourMap.entries())
    .map(([h, g]) => ({
      label: `${String(h).padStart(2, "0")}h`,
      totalMoney: g.money,
      totalR: g.rCount > 0 ? g.rSum : null,
      rPos: g.rPos,
      rNeg: g.rNeg,
      count: g.count,
      wr: g.rPos + g.rNeg > 0 ? (g.rPos / (g.rPos + g.rNeg)) * 100 : 0,
    }))
    .sort((a, b) => b.totalMoney - a.totalMoney);

  const hourMaxAbs = Math.max(...hourList.map((v) => Math.abs(v.totalMoney)), 1);

  // ── Section B: day of week ─────────────────────────────────────────────────
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const dowMap = new Map<number, { money: number; rPos: number; rNeg: number; count: number; rSum: number; rCount: number }>();
  trades.forEach((t) => {
    const d = new Date(t.dataHora);
    const dow = d.getDay();
    if (!dowMap.has(dow)) dowMap.set(dow, { money: 0, rPos: 0, rNeg: 0, count: 0, rSum: 0, rCount: 0 });
    const g = dowMap.get(dow)!;
    const money = pnl(t);
    const rv = rVal(t);
    g.money += money;
    g.count++;
    if (money > 0) g.rPos += money;
    if (money < 0) g.rNeg += Math.abs(money);
    if (rv !== null) { g.rSum += rv; g.rCount++; }
  });

  const dowList: DowGroup[] = Array.from(dowMap.entries())
    .map(([dow, g]) => ({
      label: dayNames[dow],
      totalMoney: g.money,
      totalR: g.rCount > 0 ? g.rSum : null,
      rPos: g.rPos,
      rNeg: g.rNeg,
      count: g.count,
      wr: g.rPos + g.rNeg > 0 ? (g.rPos / (g.rPos + g.rNeg)) * 100 : 0,
    }))
    .sort((a, b) => b.totalMoney - a.totalMoney);

  const dowMaxAbs = Math.max(...dowList.map((v) => Math.abs(v.totalMoney)), 1);

  // ── Section C: asset ───────────────────────────────────────────────────────
  const ativoMap = new Map<string, { money: number; wins: number; losses: number; count: number; rPos: number; rNeg: number; rSum: number; rCount: number }>();
  trades.forEach((t) => {
    const key = (t.ativo || "DESCONHECIDO").toUpperCase();
    if (!ativoMap.has(key)) ativoMap.set(key, { money: 0, wins: 0, losses: 0, count: 0, rPos: 0, rNeg: 0, rSum: 0, rCount: 0 });
    const g = ativoMap.get(key)!;
    const money = pnl(t);
    const rv = rVal(t);
    g.money += money;
    g.count++;
    if (money > 0) { g.wins++; g.rPos += money; }
    if (money < 0) { g.losses++; g.rNeg += Math.abs(money); }
    if (rv !== null) { g.rSum += rv; g.rCount++; }
  });

  const ativoList: AtivoGroup[] = Array.from(ativoMap.entries())
    .map(([lbl, g]) => ({
      lbl,
      totalMoney: g.money,
      totalR: g.rCount > 0 ? g.rSum : 0,
      rPos: g.rPos,
      rNeg: g.rNeg,
      wins: g.wins,
      losses: g.losses,
      count: g.count,
      wr: g.rPos + g.rNeg > 0 ? (g.rPos / (g.rPos + g.rNeg)) * 100 : 0,
    }))
    .sort((a, b) => b.totalMoney - a.totalMoney)
    .slice(0, 12);

  // ── empty / loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-[#6e7191]">Carregando dados...</p>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-[#6e7191]">Nenhum trade registrado ainda.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-[#0f0f1a] min-h-screen">
      {/* R$/R toggle */}
      <div className="flex items-center gap-2">
        {(["money", "r"] as const).map((m) => (
          <Button
            key={m}
            variant="ghost"
            size="sm"
            onClick={() => setDisplayMode(m)}
            className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${
              displayMode === m
                ? "bg-[#6EE000]/20 border-[#6EE000]/50 text-[#6EE000]"
                : "border-[#28283a] text-[#6e7191] hover:border-[#3a3a4a]"
            }`}
          >
            {m === "money" ? "R$" : "R"}
          </Button>
        ))}
        <span className="text-[11px] text-[#6e7191] ml-2">{trades.length} trades</span>
      </div>

      {/* ── Section A: Best Hours ─────────────────────────────────────────── */}
      <Card className="bg-[#13131a] border-[#1e1e2e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white">
            Melhores Horários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {hourList.map((h) => (
            <BarRow
              key={h.label}
              label={h.label}
              totalMoney={h.totalMoney}
              totalR={h.totalR}
              rPos={h.rPos}
              rNeg={h.rNeg}
              wr={h.wr}
              maxAbs={hourMaxAbs}
              displayMode={displayMode}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Section B: Best Days ──────────────────────────────────────────── */}
      <Card className="bg-[#13131a] border-[#1e1e2e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white">
            Melhores Dias da Semana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {dowList.map((d) => (
            <BarRow
              key={d.label}
              label={d.label}
              totalMoney={d.totalMoney}
              totalR={d.totalR}
              rPos={d.rPos}
              rNeg={d.rNeg}
              wr={d.wr}
              maxAbs={dowMaxAbs}
              displayMode={displayMode}
            />
          ))}
        </CardContent>
      </Card>

      {/* ── Section C: Performance by Asset ──────────────────────────────── */}
      <Card className="bg-[#13131a] border-[#1e1e2e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-white">
            Performance por Ativo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-600 border-b border-[#1e1e2e]">
                <th className="text-left py-2 px-3">ATIVO</th>
                <th className="text-center py-2">TRADES</th>
                <th className="text-center py-2 text-[#6EE000]">ACERTOS</th>
                <th className="text-center py-2 text-[#FF1F3D]">STOPS</th>
                <th className="text-center py-2">ASSERTIV.</th>
                <th className="text-right py-2 px-3">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {ativoList.map((a, i) => {
                const displayedTotal = fmt(a.totalMoney, a.totalR, displayMode);
                return (
                  <tr
                    key={a.lbl}
                    className={`border-b border-[#1e1e2e]/50 ${i % 2 === 0 ? "bg-[#0a0a14]" : ""}`}
                  >
                    <td className="py-2 px-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        {a.lbl}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            a.wr >= 50
                              ? "bg-[#6EE000]/15 text-[#6EE000]"
                              : "bg-[#FF1F3D]/15 text-[#FF1F3D]"
                          }`}
                        >
                          {a.wr.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-center text-gray-400">{a.count}</td>
                    <td className="text-center text-[#6EE000] font-bold">{a.wins}</td>
                    <td className="text-center text-[#FF1F3D] font-bold">{a.losses}</td>
                    <td className="text-center text-gray-300">{a.wr.toFixed(0)}%</td>
                    <td
                      className={`text-right px-3 font-bold ${
                        a.totalMoney >= 0 ? "text-[#6EE000]" : "text-[#FF1F3D]"
                      }`}
                    >
                      {displayedTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
