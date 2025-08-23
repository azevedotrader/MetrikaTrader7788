import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Diario() {
  const journalEntries = [
    {
      id: 1,
      date: "19 de Janeiro, 2024",
      createdAt: "Criado há 2 horas",
      type: "positive",
      profit: "+R$ 1.240",
      content: "Hoje foi um dia excelente! Consegui manter a disciplina nos setups de rompimento. O mercado estava volátil no período da manhã, mas soube esperar as oportunidades certas. Realizei 3 trades, todos positivos. O segredo foi manter o stop bem definido e não deixar a ganância tomar conta.",
      stats: {
        trades: 3,
        accuracy: "100%",
        emotion: "Confiante"
      }
    },
    {
      id: 2,
      date: "18 de Janeiro, 2024",
      createdAt: "Criado ontem",
      type: "negative",
      profit: "-R$ 580",
      content: "Preciso rever minha estratégia de scalp. Hoje entrei em 5 operações muito rápidas e acabei perdendo por falta de paciência. O mercado estava lateral, mas eu forcei entradas. Lição aprendida: nem todo dia é dia de operar.",
      stats: {
        trades: 5,
        accuracy: "20%",
        emotion: "Frustrado"
      }
    }
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <Button className="gradient-purple-blue hover:opacity-90 transition-opacity">
            Nova Entrada
          </Button>
        </div>

        <div className="space-y-6">
          {journalEntries.map((entry) => (
            <Card key={entry.id} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{entry.date}</h3>
                  <span className="text-sm text-slate-400">{entry.createdAt}</span>
                </div>
                <div className="mb-4">
                  <Badge 
                    variant={entry.type === "positive" ? "default" : "destructive"}
                    className={
                      entry.type === "positive" 
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                        : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    }
                  >
                    {entry.type === "positive" ? "Dia Positivo" : "Dia Negativo"}: {entry.profit}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed mb-4">
                  {entry.content}
                </p>
                <div className="flex items-center space-x-4 text-sm text-slate-400">
                  <span>💡 {entry.stats.trades} trades realizados</span>
                  <span>🎯 {entry.stats.accuracy} de acerto</span>
                  <span>😊 Sentimento: {entry.stats.emotion}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
