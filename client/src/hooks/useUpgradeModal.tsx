import { useState, useCallback } from "react";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

interface UseUpgradeModalReturn {
  UpgradeModalComponent: () => JSX.Element;
  showUpgradeModal: (options?: {
    reason?: 'limit_reached' | 'ai_feature' | 'general';
    currentUsage?: {
      csvImports: number;
      manualTrades: number;
      total: number;
    };
  }) => void;
  hideUpgradeModal: () => void;
  isUpgradeModalOpen: boolean;
}

export function useUpgradeModal(): UseUpgradeModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    reason?: 'limit_reached' | 'ai_feature' | 'general';
    currentUsage?: {
      csvImports: number;
      manualTrades: number;
      total: number;
    };
  }>({});

  const showUpgradeModal = useCallback((options = {}) => {
    setModalConfig(options);
    setIsOpen(true);
  }, []);

  const hideUpgradeModal = useCallback(() => {
    setIsOpen(false);
    setModalConfig({});
  }, []);

  const UpgradeModalComponent = useCallback(() => (
    <UpgradeModal
      open={isOpen}
      onOpenChange={setIsOpen}
      reason={modalConfig.reason}
      currentUsage={modalConfig.currentUsage}
    />
  ), [isOpen, modalConfig]);

  return {
    UpgradeModalComponent,
    showUpgradeModal,
    hideUpgradeModal,
    isUpgradeModalOpen: isOpen,
  };
}