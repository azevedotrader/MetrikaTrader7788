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
  iconColor = "text-[#6EE000]"
}: MetricCardProps) {
  const getValueColor = () => {
    if (trend === "up") return "text-[#6EE000]";
    if (trend === "down") return "text-[#FF1F3D]";
    return "text-white";
  };

  return (
    <Card className="bg-[#0f0f1a] border-[#1e1e2e]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#6e7191]">{title}</h3>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <p className={`text-2xl font-bold ${getValueColor()}`}>{value}</p>
        <p className="text-sm text-[#6e7191] mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
