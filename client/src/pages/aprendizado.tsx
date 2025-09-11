import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTour } from "@/contexts/TourContext";
import { 
  Play, 
  GraduationCap, 
  MapPin, 
  CheckCircle,
  Circle,
  ArrowRight,
  BookOpen,
  Video,
  Users,
  Route
} from "lucide-react";

// Componente Tour Interativo - Nova versão global
export function PlatformTour() {
  const { startTour } = useTour();

  return (
    <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Route className="h-5 w-5 text-blue-400" />
          Tour Interativo pela Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-zinc-300">
            Faça um tour completo e interativo pela plataforma! O sistema irá navegar automaticamente por cada seção, destacando elementos importantes e explicando como usar cada funcionalidade.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Navegação automática entre páginas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Destaques visuais em elementos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Explicações contextuais detalhadas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>13 passos completos</span>
            </div>
          </div>
          <Button onClick={startTour} className="bg-blue-600 hover:bg-blue-700 w-full">
            <Play className="h-4 w-4 mr-2" />
            Iniciar Tour Interativo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente principal da página de Aprendizado
export default function Aprendizado() {
  const { t } = useLanguage();

  const videoSections = [
    {
      title: "Primeiros Passos",
      description: "Aprenda o básico para começar a usar a plataforma",
      videos: [
        { title: "Como registrar seu primeiro trade", duration: "5:30", completed: false },
        { title: "Importando dados via CSV", duration: "8:45", completed: false },
        { title: "Configurando suas metas", duration: "4:20", completed: false },
      ]
    },
    {
      title: "Análise e Relatórios", 
      description: "Domine as ferramentas de análise da plataforma",
      videos: [
        { title: "Lendo métricas do dashboard", duration: "12:15", completed: false },
        { title: "Usando o calendário de trading", duration: "9:30", completed: false },
        { title: "Interpretando gráficos de performance", duration: "15:45", completed: false },
      ]
    },
    {
      title: "Recursos Avançados",
      description: "Aproveite ao máximo as funcionalidades premium", 
      videos: [
        { title: "IA para análise de CSV", duration: "10:20", completed: false },
        { title: "Gestão avançada de risco", duration: "13:10", completed: false },
        { title: "Diário de trading e insights", duration: "11:50", completed: false },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Centro de Aprendizado
            </h1>
          </div>
          <p className="text-zinc-300 text-lg max-w-2xl mx-auto">
            Domine a plataforma de trading com nossos tutoriais e faça um tour guiado por todas as funcionalidades
          </p>
        </div>

        {/* Tour da Plataforma */}
        <PlatformTour />

        {/* Videoaulas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-purple-400" />
            Videoaulas
          </h2>
          
          <div className="grid gap-6">
            {videoSections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="bg-zinc-900/90 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                    {section.title}
                  </CardTitle>
                  <p className="text-zinc-400">{section.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {section.videos.map((video, videoIndex) => (
                      <div 
                        key={videoIndex}
                        className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          {video.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300" />
                          )}
                          <div>
                            <h4 className="text-white font-medium group-hover:text-blue-300 transition-colors">
                              {video.title}
                            </h4>
                            <span className="text-sm text-zinc-500">{video.duration}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Estatísticas de Progresso */}
        <Card className="bg-zinc-900/90 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Seu Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-400 mb-1">0 / 12</div>
                <div className="text-sm text-zinc-400">Vídeos Assistidos</div>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 mb-1">0%</div>
                <div className="text-sm text-zinc-400">Progresso Geral</div>
              </div>
              <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-1">--:--</div>
                <div className="text-sm text-zinc-400">Tempo Assistido</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}