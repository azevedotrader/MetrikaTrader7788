import { taxaAcertoDe } from "./utils";

/**
 * Motor de análise do desempenho do trader.
 *
 * Gera conselhos, pontos de atenção e sugestões a partir dos trades que já
 * estão registrados — manuais ou importados por CSV. É determinístico: não
 * depende de nenhum serviço externo nem de chave de API, então funciona
 * sempre e dá a mesma resposta para os mesmos dados.
 *
 * Toda conclusão vem acompanhada do número que a sustenta, e nenhuma regra
 * dispara sem amostra suficiente — conselho tirado de 2 ou 3 operações não
 * vale nada e só atrapalha quem está começando.
 */

export type TipoInsight = "forte" | "atencao" | "sugestao";

export interface Insight {
  tipo: TipoInsight;
  titulo: string;
  detalhe: string;
  /** Número que sustenta a conclusão, mostrado ao lado do texto. */
  evidencia: string;
}

interface TradeBruto {
  resultado?: string | number | null;
  dataHora?: string | null;
  ativo?: string | null;
  emocao?: string | null;
}

interface TradeNorm {
  r: number;
  data: Date | null;
  ativo: string;
  emocao: string;
}

/** Amostra mínima para uma conclusão ter valor. */
const MIN_AMOSTRA_GERAL = 10;
const MIN_AMOSTRA_GRUPO = 6;

function normalizar(trades: TradeBruto[]): TradeNorm[] {
  return (trades || [])
    .map((t) => {
      const r = parseFloat(String(t?.resultado ?? 0));
      const bruta = t?.dataHora ? new Date(t.dataHora) : null;
      return {
        r: Number.isFinite(r) ? r : 0,
        data: bruta && !isNaN(bruta.getTime()) ? bruta : null,
        ativo: (t?.ativo || "").toUpperCase().trim(),
        emocao: (t?.emocao || "").toLowerCase().trim(),
      };
    })
    .sort((a, b) => {
      if (!a.data || !b.data) return 0;
      return a.data.getTime() - b.data.getTime();
    });
}

const fmt = (n: number, casas = 2) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: casas }).format(n);

const fmtR = (n: number) => `${n > 0 ? "+" : ""}${fmt(n)}R`;

interface Grupo {
  chave: string;
  acertos: number;
  erros: number;
  neutros: number;
  somaR: number;
  total: number;
}

function agrupar(trades: TradeNorm[], chaveDe: (t: TradeNorm) => string | null): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const t of trades) {
    const chave = chaveDe(t);
    if (chave === null) continue;
    if (!mapa.has(chave)) {
      mapa.set(chave, { chave, acertos: 0, erros: 0, neutros: 0, somaR: 0, total: 0 });
    }
    const g = mapa.get(chave)!;
    g.total++;
    g.somaR += t.r;
    if (t.r > 0) g.acertos++;
    else if (t.r < 0) g.erros++;
    else g.neutros++;
  }
  return Array.from(mapa.values());
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function gerarInsights(tradesBrutos: TradeBruto[]): Insight[] {
  const trades = normalizar(tradesBrutos);
  const insights: Insight[] = [];

  const decididos = trades.filter((t) => t.r !== 0);
  const acertos = trades.filter((t) => t.r > 0);
  const erros = trades.filter((t) => t.r < 0);
  const neutros = trades.filter((t) => t.r === 0);

  if (decididos.length < MIN_AMOSTRA_GERAL) {
    return [
      {
        tipo: "sugestao",
        titulo: "Registre mais operações",
        detalhe:
          `Com ${decididos.length} ${decididos.length === 1 ? "operação decidida" : "operações decididas"} ainda não dá para tirar conclusão confiável. ` +
          `A partir de ${MIN_AMOSTRA_GERAL} a análise começa a apontar padrões reais do seu operacional.`,
        evidencia: `${decididos.length}/${MIN_AMOSTRA_GERAL}`,
      },
    ];
  }

  const wr = taxaAcertoDe(acertos.length, erros.length);
  const somaR = trades.reduce((s, t) => s + t.r, 0);
  const ganhoMedio = acertos.length ? acertos.reduce((s, t) => s + t.r, 0) / acertos.length : 0;
  const perdaMedia = erros.length ? Math.abs(erros.reduce((s, t) => s + t.r, 0) / erros.length) : 0;
  const payoff = perdaMedia > 0 ? ganhoMedio / perdaMedia : 0;
  const expectativa = (wr / 100) * ganhoMedio - (1 - wr / 100) * perdaMedia;

  // ── Expectativa matemática: o número que decide se a estratégia se paga ──
  if (expectativa > 0) {
    insights.push({
      tipo: "forte",
      titulo: "Sua estratégia tem expectativa positiva",
      detalhe:
        `Cada operação devolve em média ${fmtR(expectativa)}. Combinando ${fmt(wr, 1)}% de acerto com ganho médio de ` +
        `${fmt(ganhoMedio)}R contra perda média de ${fmt(perdaMedia)}R, o conjunto se paga. Mantenha o mesmo critério de entrada.`,
      evidencia: `${fmtR(expectativa)}/trade`,
    });
  } else {
    insights.push({
      tipo: "atencao",
      titulo: "Expectativa matemática negativa",
      detalhe:
        `Cada operação custa em média ${fmtR(expectativa)}. Com ${fmt(wr, 1)}% de acerto, você precisaria de um ganho médio acima de ` +
        `${fmt(perdaMedia * ((100 - wr) / Math.max(wr, 1)))}R para o conjunto virar — hoje ele está em ${fmt(ganhoMedio)}R. ` +
        `Ou aumenta o alvo, ou reduz o stop, ou aperta o critério de entrada.`,
      evidencia: `${fmtR(expectativa)}/trade`,
    });
  }

  // ── Payoff x acerto: as duas alavancas que se compensam ──
  if (payoff > 0 && payoff < 1 && wr < 55) {
    insights.push({
      tipo: "atencao",
      titulo: "Perdas maiores que os ganhos",
      detalhe:
        `Seu ganho médio (${fmt(ganhoMedio)}R) é menor que a perda média (${fmt(perdaMedia)}R), e o acerto de ${fmt(wr, 1)}% não compensa essa diferença. ` +
        `É o padrão clássico de cortar o lucro cedo e deixar a perda correr. Leve o alvo até onde o plano definiu e respeite o stop original.`,
      evidencia: `payoff ${fmt(payoff)}`,
    });
  } else if (payoff >= 2) {
    insights.push({
      tipo: "forte",
      titulo: "Bom payoff",
      detalhe:
        `Seus ganhos são ${fmt(payoff)}x maiores que suas perdas. Com esse payoff, você se sustenta mesmo errando mais da metade das vezes — ` +
        `precisa de apenas ${fmt(100 / (1 + payoff), 1)}% de acerto para empatar, e está em ${fmt(wr, 1)}%.`,
      evidencia: `payoff ${fmt(payoff)}`,
    });
  }

  // ── Consistência do risco: stop padronizado ou no improviso? ──
  if (erros.length >= MIN_AMOSTRA_GRUPO) {
    const perdas = erros.map((t) => Math.abs(t.r));
    const media = perdas.reduce((a, b) => a + b, 0) / perdas.length;
    const desvio = Math.sqrt(perdas.reduce((s, p) => s + (p - media) ** 2, 0) / perdas.length);
    const cv = media > 0 ? desvio / media : 0;
    const maiorPerda = Math.max(...perdas);

    if (cv > 0.6) {
      insights.push({
        tipo: "atencao",
        titulo: "Risco inconsistente entre operações",
        detalhe:
          `Suas perdas variam muito: média de ${fmt(media)}R, mas com casos de até ${fmt(maiorPerda)}R. ` +
          `Risco desigual faz uma única operação ruim apagar várias boas. Padronize o tamanho da posição para que todo stop custe o mesmo.`,
        evidencia: `variação ${fmt(cv * 100, 0)}%`,
      });
    } else if (cv < 0.3) {
      insights.push({
        tipo: "forte",
        titulo: "Risco padronizado",
        detalhe:
          `Suas perdas ficam consistentemente perto de ${fmt(media)}R. Isso é sinal de gestão de risco disciplinada e torna seu resultado previsível.`,
        evidencia: `variação ${fmt(cv * 100, 0)}%`,
      });
    }

    if (maiorPerda > media * 2.5) {
      insights.push({
        tipo: "atencao",
        titulo: "Uma perda muito acima do seu padrão",
        detalhe:
          `A maior perda foi de ${fmt(maiorPerda)}R, ${fmt(maiorPerda / media)}x a sua perda média. ` +
          `Vale revisar essa operação: normalmente é stop movido, posição aumentada no prejuízo ou entrada fora do plano.`,
        evidencia: `-${fmt(maiorPerda)}R`,
      });
    }
  }

  // ── Comportamento depois de perder: revenge trading ──
  const aposPerda: TradeNorm[] = [];
  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].r < 0 && trades[i].r !== 0) aposPerda.push(trades[i]);
  }
  if (aposPerda.length >= MIN_AMOSTRA_GRUPO) {
    const wrApos = taxaAcertoDe(
      aposPerda.filter((t) => t.r > 0).length,
      aposPerda.filter((t) => t.r < 0).length
    );
    if (wrApos < wr - 10) {
      insights.push({
        tipo: "atencao",
        titulo: "Seu desempenho cai depois de uma perda",
        detalhe:
          `Logo após um stop, seu acerto cai para ${fmt(wrApos, 1)}%, contra ${fmt(wr, 1)}% no geral (${aposPerda.length} operações analisadas). ` +
          `É o sinal típico de tentar recuperar rápido. Uma pausa curta depois de cada perda tende a corrigir isso.`,
        evidencia: `${fmt(wrApos, 1)}% vs ${fmt(wr, 1)}%`,
      });
    } else if (wrApos > wr + 10) {
      insights.push({
        tipo: "forte",
        titulo: "Você reage bem às perdas",
        detalhe:
          `Depois de um stop, seu acerto é de ${fmt(wrApos, 1)}%, acima dos ${fmt(wr, 1)}% gerais. ` +
          `Você não entra em revanche — mantém o critério mesmo depois de perder.`,
        evidencia: `${fmt(wrApos, 1)}% vs ${fmt(wr, 1)}%`,
      });
    }
  }

  // ── Sequência de perdas: dimensiona o drawdown emocional ──
  let seqAtual = 0;
  let maiorSeq = 0;
  for (const t of trades) {
    if (t.r < 0) {
      seqAtual++;
      maiorSeq = Math.max(maiorSeq, seqAtual);
    } else if (t.r > 0) {
      seqAtual = 0;
    }
  }
  if (maiorSeq >= 4) {
    insights.push({
      tipo: "sugestao",
      titulo: `Já teve ${maiorSeq} perdas seguidas`,
      detalhe:
        `Uma sequência assim é normal e vai se repetir. Com risco fixo, ela custaria cerca de ${fmt(maiorSeq * perdaMedia)}R. ` +
        `Defina um limite de perdas no dia para não transformar uma sequência ruim em um prejuízo grande.`,
      evidencia: `${maiorSeq} seguidas`,
    });
  }

  // ── Melhor e pior horário ──
  const porHora = agrupar(trades, (t) => (t.data ? String(t.data.getHours()) : null))
    .filter((g) => g.acertos + g.erros >= MIN_AMOSTRA_GRUPO);
  if (porHora.length >= 2) {
    const ordenado = [...porHora].sort((a, b) => b.somaR - a.somaR);
    const melhor = ordenado[0];
    const pior = ordenado[ordenado.length - 1];
    if (melhor.somaR > 0) {
      insights.push({
        tipo: "forte",
        titulo: `Seu melhor horário é ${melhor.chave}h`,
        detalhe:
          `Nesse horário você acumula ${fmtR(melhor.somaR)} com ${fmt(taxaAcertoDe(melhor.acertos, melhor.erros), 1)}% de acerto em ${melhor.total} operações. ` +
          `Concentrar esforço nessa janela tende a render mais que espalhar o dia inteiro.`,
        evidencia: fmtR(melhor.somaR),
      });
    }
    if (pior.somaR < 0 && pior.chave !== melhor.chave) {
      insights.push({
        tipo: "atencao",
        titulo: `Às ${pior.chave}h você perde dinheiro`,
        detalhe:
          `Acumulado de ${fmtR(pior.somaR)} nesse horário, com ${fmt(taxaAcertoDe(pior.acertos, pior.erros), 1)}% de acerto em ${pior.total} operações. ` +
          `Cortar essa janela por algumas semanas é um teste barato: se o resultado melhorar, você achou um vazamento.`,
        evidencia: fmtR(pior.somaR),
      });
    }
  }

  // ── Melhor e pior dia da semana ──
  const porDia = agrupar(trades, (t) => (t.data ? String(t.data.getDay()) : null))
    .filter((g) => g.acertos + g.erros >= MIN_AMOSTRA_GRUPO);
  if (porDia.length >= 2) {
    const ordenado = [...porDia].sort((a, b) => b.somaR - a.somaR);
    const pior = ordenado[ordenado.length - 1];
    const melhor = ordenado[0];
    if (pior.somaR < 0) {
      insights.push({
        tipo: "atencao",
        titulo: `${DIAS[Number(pior.chave)].replace(/^./, (c) => c.toUpperCase())} é seu pior dia`,
        detalhe:
          `Acumulado de ${fmtR(pior.somaR)} nesse dia da semana, contra ${fmtR(melhor.somaR)} na ${DIAS[Number(melhor.chave)]}. ` +
          `Vale olhar o que muda na sua rotina nesse dia — agenda de notícias, cansaço ou pressa para fechar a semana.`,
        evidencia: fmtR(pior.somaR),
      });
    }
  }

  // ── Melhor e pior ativo ──
  const porAtivo = agrupar(trades, (t) => t.ativo || null)
    .filter((g) => g.chave && g.acertos + g.erros >= MIN_AMOSTRA_GRUPO);
  if (porAtivo.length >= 2) {
    const ordenado = [...porAtivo].sort((a, b) => b.somaR - a.somaR);
    const melhor = ordenado[0];
    const pior = ordenado[ordenado.length - 1];
    if (melhor.somaR > 0) {
      insights.push({
        tipo: "forte",
        titulo: `${melhor.chave} é seu ativo mais rentável`,
        detalhe:
          `${fmtR(melhor.somaR)} acumulados com ${fmt(taxaAcertoDe(melhor.acertos, melhor.erros), 1)}% de acerto em ${melhor.total} operações. ` +
          `Você claramente lê bem esse ativo.`,
        evidencia: fmtR(melhor.somaR),
      });
    }
    if (pior.somaR < 0 && pior.chave !== melhor.chave) {
      insights.push({
        tipo: "sugestao",
        titulo: `${pior.chave} está drenando resultado`,
        detalhe:
          `${fmtR(pior.somaR)} acumulados em ${pior.total} operações, com ${fmt(taxaAcertoDe(pior.acertos, pior.erros), 1)}% de acerto. ` +
          `Ou esse ativo não combina com o seu setup, ou merece um estudo à parte antes de continuar operando.`,
        evidencia: fmtR(pior.somaR),
      });
    }
  }

  // ── Volume diário: overtrading ──
  const porDiaCalendario = agrupar(trades, (t) =>
    t.data ? t.data.toISOString().slice(0, 10) : null
  );
  if (porDiaCalendario.length >= 5) {
    const contagens = porDiaCalendario.map((g) => g.total).sort((a, b) => a - b);
    const mediana = contagens[Math.floor(contagens.length / 2)];
    const pesados = porDiaCalendario.filter((g) => g.total >= mediana * 2 && g.total >= 4);
    if (pesados.length >= 2) {
      const rPesados = pesados.reduce((s, g) => s + g.somaR, 0);
      const leves = porDiaCalendario.filter((g) => g.total < mediana * 2);
      const rLeves = leves.reduce((s, g) => s + g.somaR, 0);
      const mediaPesados = rPesados / pesados.length;
      const mediaLeves = leves.length ? rLeves / leves.length : 0;
      if (mediaPesados < mediaLeves) {
        insights.push({
          tipo: "atencao",
          titulo: "Dias de muitas operações rendem menos",
          detalhe:
            `Nos dias em que você opera bem acima do seu normal (${mediana} por dia), o resultado médio é ${fmtR(mediaPesados)}, ` +
            `contra ${fmtR(mediaLeves)} nos dias comuns. Mais operações não está virando mais lucro — está virando mais exposição.`,
          evidencia: `${fmtR(mediaPesados)} vs ${fmtR(mediaLeves)}`,
        });
      }
    }
  }

  // ── Excesso de breakeven ──
  if (trades.length >= MIN_AMOSTRA_GERAL) {
    const pctNeutro = (neutros.length / trades.length) * 100;
    if (pctNeutro > 30) {
      insights.push({
        tipo: "sugestao",
        titulo: "Muitas operações terminando em 0x0",
        detalhe:
          `${fmt(pctNeutro, 0)}% dos seus trades fecham no zero a zero (${neutros.length} de ${trades.length}). ` +
          `Eles não machucam o resultado, mas podem indicar stop movido para o ponto de entrada cedo demais, ` +
          `tirando você de operações que ainda iam andar a favor.`,
        evidencia: `${fmt(pctNeutro, 0)}% do total`,
      });
    }
  }

  // ── Tendência recente ──
  if (decididos.length >= 20) {
    const metade = Math.floor(decididos.length / 2);
    const antigos = decididos.slice(0, metade);
    const recentes = decididos.slice(metade);
    const wrAntigo = taxaAcertoDe(
      antigos.filter((t) => t.r > 0).length,
      antigos.filter((t) => t.r < 0).length
    );
    const wrRecente = taxaAcertoDe(
      recentes.filter((t) => t.r > 0).length,
      recentes.filter((t) => t.r < 0).length
    );
    if (wrRecente > wrAntigo + 8) {
      insights.push({
        tipo: "forte",
        titulo: "Você está evoluindo",
        detalhe:
          `Na metade mais recente das suas operações o acerto é de ${fmt(wrRecente, 1)}%, contra ${fmt(wrAntigo, 1)}% no início. ` +
          `O que você mudou está funcionando — vale registrar no diário o que foi.`,
        evidencia: `${fmt(wrAntigo, 1)}% → ${fmt(wrRecente, 1)}%`,
      });
    } else if (wrRecente < wrAntigo - 8) {
      insights.push({
        tipo: "atencao",
        titulo: "Seu desempenho piorou recentemente",
        detalhe:
          `O acerto caiu de ${fmt(wrAntigo, 1)}% para ${fmt(wrRecente, 1)}% na metade mais recente. ` +
          `Compare as operações dos dois períodos: normalmente é mudança de horário, de ativo ou afrouxamento do critério de entrada.`,
        evidencia: `${fmt(wrAntigo, 1)}% → ${fmt(wrRecente, 1)}%`,
      });
    }
  }

  // ── Emoção registrada ──
  const comEmocao = trades.filter((t) => t.emocao && t.emocao !== "neutro");
  if (comEmocao.length >= MIN_AMOSTRA_GERAL) {
    const porEmocao = agrupar(comEmocao, (t) => t.emocao || null).filter(
      (g) => g.acertos + g.erros >= MIN_AMOSTRA_GRUPO
    );
    if (porEmocao.length >= 2) {
      const pior = [...porEmocao].sort((a, b) => a.somaR - b.somaR)[0];
      if (pior.somaR < 0) {
        insights.push({
          tipo: "atencao",
          titulo: `Operar "${pior.chave}" custa caro`,
          detalhe:
            `Quando você marcou esse estado emocional, o acumulado foi de ${fmtR(pior.somaR)} em ${pior.total} operações. ` +
            `Reconhecer esse estado antes de entrar já evita boa parte do prejuízo.`,
          evidencia: fmtR(pior.somaR),
        });
      }
    }
  }

  // ── Resultado geral, sempre por último ──
  insights.push({
    tipo: somaR > 0 ? "forte" : "atencao",
    titulo: somaR > 0 ? "Resultado acumulado positivo" : "Resultado acumulado negativo",
    detalhe:
      `${trades.length} operações registradas: ${acertos.length} acertos, ${erros.length} erros e ${neutros.length} no zero a zero. ` +
      `Acerto de ${fmt(wr, 1)}% e acumulado de ${fmtR(somaR)}.`,
    evidencia: fmtR(somaR),
  });

  return insights;
}
