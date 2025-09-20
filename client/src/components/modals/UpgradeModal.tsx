import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Sparkles, TrendingUp, Zap, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsage?: {
    csvImports: number;
    manualTrades: number;
    total: number;
  };
  reason?: 'limit_reached' | 'ai_feature' | 'general';
}

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  currentUsage,
  reason = 'general' 
}: UpgradeModalProps) {
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'black'>('starter');

  const plans = {
    starter: {
      name: t('pricing.plans.starter.name'),
      price: 'R$ 19,90',
      features: [
        t('pricing.plans.starter.features.unlimitedTrades'),
        t('pricing.plans.starter.features.csvImport'),
        t('pricing.plans.starter.features.aiAnalysis'),
        t('pricing.plans.starter.features.tradingJournal'),
        t('pricing.plans.starter.features.basicCharts'),
        t('pricing.plans.starter.features.emailSupport')
      ],
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    black: {
      name: t('pricing.plans.black.name'),
      price: 'R$ 49,90',
      features: [
        t('pricing.plans.black.features.everything'),
        t('pricing.plans.black.features.advancedAi'),
        t('pricing.plans.black.features.customReports'),
        t('pricing.plans.black.features.prioritySupport'),
        t('pricing.plans.black.features.apiAccess'),
        t('pricing.plans.black.features.earlyAccess')
      ],
      icon: <Crown className="h-5 w-5" />,
      color: 'bg-purple-600'
    }
  };

  const getModalContent = () => {
    switch (reason) {
      case 'limit_reached':
        return {
          title: t('upgrade.limitReached.title'),
          description: currentUsage 
            ? t('upgrade.limitReached.description', { 
                current: currentUsage.total, 
                limit: 10 
              })
            : t('upgrade.limitReached.descriptionGeneral'),
          urgency: true
        };
      case 'ai_feature':
        return {
          title: t('upgrade.aiFeature.title'),
          description: t('upgrade.aiFeature.description'),
          urgency: false
        };
      default:
        return {
          title: t('upgrade.general.title'),
          description: t('upgrade.general.description'),
          urgency: false
        };
    }
  };

  const content = getModalContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-upgrade">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold" data-testid="text-upgrade-title">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground max-w-2xl mx-auto" data-testid="text-upgrade-description">
            {content.description}
          </DialogDescription>
          
          {currentUsage && reason === 'limit_reached' && (
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mx-auto max-w-sm">
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {t('upgrade.usage.current')}: {currentUsage.total}/10
                </span>
              </div>
              <div className="mt-2 flex justify-center space-x-4 text-xs text-orange-700 dark:text-orange-300">
                <span>{t('upgrade.usage.csvImports')}: {currentUsage.csvImports}</span>
                <span>{t('upgrade.usage.manualTrades')}: {currentUsage.manualTrades}</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <Separator className="my-6" />

        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                selectedPlan === key
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedPlan(key as 'starter' | 'black')}
              data-testid={`plan-${key}`}
            >
              {key === 'black' && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  data-testid="badge-popular"
                >
                  {t('upgrade.plans.popular')}
                </Badge>
              )}
              
              <div className="text-center mb-4">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${plan.color} text-white mb-3`}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold" data-testid={`text-plan-name-${key}`}>
                  {plan.name}
                </h3>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2" data-testid={`text-plan-price-${key}`}>
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/{t('upgrade.plans.perMonth')}</span>
                </div>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3" data-testid={`feature-${key}-${index}`}>
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            data-testid="button-cancel"
          >
            <X className="w-4 h-4 mr-2" />
            {t('upgrade.buttons.cancel')}
          </Button>
          
          <Button
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            onClick={() => {
              // TODO: Implement upgrade functionality
              console.log('Upgrading to:', selectedPlan);
              onOpenChange(false);
            }}
            data-testid="button-upgrade"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('upgrade.buttons.upgrade')} {plans[selectedPlan].name}
          </Button>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground" data-testid="text-guarantee">
            {t('upgrade.guarantee')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}