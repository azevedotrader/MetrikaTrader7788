import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { gerarInsights, type Insight, type TipoInsight } from "@/lib/insights";

const ESTILO: Record<
  TipoInsight,
  { rotulo: string; icone: typeof TrendingUp; cor: string; fundo: string; borda: string }
> = {
  forte: {
    rotulo: "Ponto forte",
    icone: TrendingUp,
    cor: "text-[#6EE000]",
    fundo: "bg-[#6EE000]/5",
    borda: "border-[#6EE000]/25",
  },
  atencao: {
    rotulo: "Atenção",
    icone: AlertTriangle,
    cor: "text-[#FF1F3D]",
    fundo: "bg-[#FF1F3D]/5",
    borda: "border-[#FF1F3D]/25",
  },
  sugestao: {
    rotulo: "Sugestão",
    icone: Lightbulb,
    cor: "text-amber-400",
    fundo: "bg-amber-400/5",
    borda: "border-amber-400/25",
  },
};

const ORDEM: TipoInsight[] = ["atencao", "sugestao", "forte"];

function CartaoInsight({ insight }: { insight: Insight }) {
  const estilo = ESTILO[insight.tipo];
  const Icone = estilo.icone;

  return (
    <div
      className={cn("rounded-lg border p-3 sm:p-4", estilo.fundo, estilo.borda)}
      data-testid={`insight-${insight.tipo}`}
    >
      <div className="flex items-start gap-3">
        <Icone className={cn("w-4 h-4 mt-0.5 shrink-0", estilo.cor)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h4 className="font-semibold text-[var(--text)] text-sm leading-snug">
              {insight.titulo}
            </h4>
            <span
              className={cn(
                "text-xs font-bold tabular-nums whitespace-nowrap shrink-0",
                estilo.cor
              )}
            >
              {insight.evidencia}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[var(--dim)] mt-1.5 leading-relaxed">
            {insight.detalhe}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Painel de recomendações calculado a partir dos trades do próprio usuário.
 * Os "Pontos de atenção" vêm primeiro de propósito: é o que muda o resultado.
 */
export function TradeInsights({ trades }: { trades: any[] }) {
  const [expandido, setExpandido] = useState(false);

  const insights = useMemo(() => {
    const gerados = gerarInsights(trades || []);
    return [...gerados].sort((a, b) => ORDEM.indexOf(a.tipo) - ORDEM.indexOf(b.tipo));
  }, [trades]);

  const visiveis = expandido ? insights : insights.slice(0, 4);
  const contagem = {
    atencao: insights.filter((i) => i.tipo === "atencao").length,
    sugestao: insights.filter((i) => i.tipo === "sugestao").length,
    forte: insights.filter((i) => i.tipo === "forte").length,
  };

  return (
    <Card className="tr-premium-card" data-testid="card-trade-insights">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          Análise e Recomendações
          <span className="text-xs font-normal text-[var(--dim)]">
            {contagem.atencao > 0 && `${contagem.atencao} atenção`}
            {contagem.atencao > 0 && contagem.sugestao > 0 && " · "}
            {contagem.sugestao > 0 && `${contagem.sugestao} sugestão`}
            {(contagem.atencao > 0 || contagem.sugestao > 0) && contagem.forte > 0 && " · "}
            {contagem.forte > 0 && `${contagem.forte} ponto forte`}
          </span>
        </CardTitle>
        <p className="text-xs text-[var(--dim)]">
          Calculado a partir das suas operações registradas, manuais e importadas.
        </p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {visiveis.map((insight, i) => (
          <CartaoInsight key={`${insight.tipo}-${insight.titulo}-${i}`} insight={insight} />
        ))}

        {insights.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandido((v) => !v)}
            className="w-full text-[var(--dim)] hover:text-[var(--text)]"
            data-testid="button-toggle-insights"
          >
            {expandido ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1.5" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1.5" />
                Ver mais {insights.length - 4}{" "}
                {insights.length - 4 === 1 ? "análise" : "análises"}
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
