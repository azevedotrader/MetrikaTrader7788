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
interface PlatformTourProps {
  t: (key: string) => string;
}

export function PlatformTour({ t }: PlatformTourProps) {
  const { startTour } = useTour();

  return (
    <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Route className="h-5 w-5 text-blue-400" />
          {t('learning.tour_interactive')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-zinc-300">
            {t('learning.tour_description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{t('learning.tour_features.auto_nav')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{t('learning.tour_features.highlights')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{t('learning.tour_features.explanations')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{t('learning.tour_features.steps')}</span>
            </div>
          </div>
          <Button onClick={startTour} className="bg-blue-600 hover:bg-blue-700 w-full">
            <Play className="h-4 w-4 mr-2" />
            {t('learning.tour_start')}
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
      title: t("learning.sections.basics"),
      description: t("learning.sections.basics_desc"),
      videos: [
        { title: t("learning.videos.first_trade"), duration: "5:30", completed: false },
        { title: t("learning.videos.csv_import"), duration: "8:45", completed: false },
        { title: t("learning.videos.goals"), duration: "4:20", completed: false },
      ]
    },
    {
      title: t("learning.sections.analysis"), 
      description: t("learning.sections.analysis_desc"),
      videos: [
        { title: t("learning.videos.dashboard"), duration: "12:15", completed: false },
        { title: t("learning.videos.calendar"), duration: "9:30", completed: false },
        { title: t("learning.videos.charts"), duration: "15:45", completed: false },
      ]
    },
    {
      title: t("learning.sections.advanced"),
      description: t("learning.sections.advanced_desc"), 
      videos: [
        { title: t("learning.videos.ai_csv"), duration: "10:20", completed: false },
        { title: t("learning.videos.risk"), duration: "13:10", completed: false },
        { title: t("learning.videos.journal"), duration: "11:50", completed: false },
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
              {t('learning.title')}
            </h1>
          </div>
          <p className="text-zinc-300 text-lg max-w-2xl mx-auto">
            {t('learning.description')}
          </p>
        </div>

        {/* Tour da Plataforma */}
        <PlatformTour t={t} />

        {/* Videoaulas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-purple-400" />
            {t('learning.videos')}
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

        
      </div>
    </div>
  );
}