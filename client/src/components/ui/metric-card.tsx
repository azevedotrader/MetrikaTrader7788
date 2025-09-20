import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  iconColor?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend = "neutral",
  iconColor = "text-purple-600"
}: MetricCardProps) {
  const getValueColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-white";
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className={`text-2xl font-bold ${getValueColor()}`}>{value}</p>
        <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
