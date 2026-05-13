import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, Plus, MoreVertical, Pencil, Trash2, Loader2, FolderOpen, TrendingUp, Bitcoin, DollarSign, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Wallet as WalletType } from "@shared/schema";

const WALLET_COLORS = [
  { key: "colorPurple", value: "#8B5CF6" },
  { key: "colorBlue", value: "#3B82F6" },
  { key: "colorGreen", value: "#10B981" },
  { key: "colorYellow", value: "#F59E0B" },
  { key: "colorRed", value: "#EF4444" },
  { key: "colorPink", value: "#EC4899" },
  { key: "colorIndigo", value: "#6366F1" },
  { key: "colorCyan", value: "#06B6D4" },
];

const WALLET_ICONS = [
  { key: "iconWallet", value: "wallet", icon: Wallet },
  { key: "iconTrending", value: "trending", icon: TrendingUp },
  { key: "iconCrypto", value: "bitcoin", icon: Bitcoin },
  { key: "iconDollar", value: "dollar", icon: DollarSign },
  { key: "iconChart", value: "chart", icon: BarChart3 },
  { key: "iconFolder", value: "folder", icon: FolderOpen },
];

function getIconComponent(iconValue: string) {
  const iconData = WALLET_ICONS.find(i => i.value === iconValue);
  return iconData?.icon || Wallet;
}

export default function Carteiras() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#8B5CF6",
    icon: "wallet",
  });

  const { data: wallets = [], isLoading } = useQuery<WalletType[]>({
    queryKey: ["/api/wallets"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/wallets", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t("wallets.created"),
        description: t("wallets.createdDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("wallets.errorCreate"),
        description: error.message || t("wallets.tryAgain"),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/wallets/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t("wallets.updated"),
        description: t("wallets.updatedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setIsEditOpen(false);
      setEditingWallet(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("wallets.errorUpdate"),
        description: error.message || t("wallets.tryAgain"),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/wallets/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: t("wallets.deleted"),
        description: t("wallets.deletedDescription"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: t("wallets.errorDelete"),
        description: error.message || t("wallets.tryAgain"),
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#8B5CF6",
      icon: "wallet",
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: t("wallets.nameRequired"),
        description: t("wallets.nameRequiredDescription"),
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (wallet: WalletType) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      description: wallet.description || "",
      color: wallet.color || "#8B5CF6",
      icon: wallet.icon || "wallet",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingWallet) return;
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: t("wallets.nameRequired"),
        description: t("wallets.nameRequiredDescription"),
      });
      return;
    }
    updateMutation.mutate({ id: editingWallet.id, data: formData });
  };

  const handleDelete = (wallet: WalletType) => {
    if (confirm(`${t("wallets.deleteConfirm")} "${wallet.name}"?`)) {
      deleteMutation.mutate(wallet.id);
    }
  };

  const defaultMarkets = [
    { name: "Crypto", color: "#F59E0B", icon: "bitcoin", descKey: "wallets.cryptoDescription" },
    { name: "Forex", color: "#10B981", icon: "dollar", descKey: "wallets.forexDescription" },
    { name: "B3", color: "#3B82F6", icon: "chart", descKey: "wallets.b3Description" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{t("wallets.title")}</h1>
          <p className="text-[var(--dim)] mt-1">
            {t("wallets.subtitle")}
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-[#6EE000] to-[#448aff] hover:from-[#6EE000] hover:to-[#3a7aff]"
              data-testid="button-create-wallet"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("wallets.newWallet")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--card)] border-[var(--brd)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--text)]">{t("wallets.createTitle")}</DialogTitle>
              <DialogDescription className="text-[var(--dim)]">
                {t("wallets.createDescription")}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--text)]">{t("wallets.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("wallets.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                  data-testid="input-wallet-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[var(--text)]">{t("wallets.description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("wallets.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] resize-none"
                  rows={3}
                  data-testid="input-wallet-description"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[var(--text)]">{t("wallets.color")}</Label>
                <div className="flex gap-2 flex-wrap">
                  {WALLET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--card)] scale-110" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={t(`wallets.${color.key}`)}
                      data-testid={`color-${color.value}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-[var(--text)]">{t("wallets.icon")}</Label>
                <div className="flex gap-2 flex-wrap">
                  {WALLET_ICONS.map((iconData) => {
                    const IconComponent = iconData.icon;
                    return (
                      <button
                        key={iconData.value}
                        onClick={() => setFormData({ ...formData, icon: iconData.value })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
                          formData.icon === iconData.value 
                            ? "border-[#6EE000] bg-[#6EE000]/20 text-[#6EE000]" 
                            : "border-[var(--brd)] bg-[var(--surf)] text-[var(--dim)] hover:border-[var(--brd2)]"
                        }`}
                        title={t(`wallets.${iconData.key}`)}
                        data-testid={`icon-${iconData.value}`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => { setIsCreateOpen(false); resetForm(); }}
                className="border-[var(--brd)] text-[var(--dim)] hover:bg-[var(--surf)]"
              >
                {t("wallets.cancel")}
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-[#6EE000] to-[#448aff] hover:from-[#6EE000] hover:to-[#3a7aff]"
                data-testid="button-confirm-create"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t("wallets.create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t("wallets.defaultMarkets")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {defaultMarkets.map((market) => {
              const IconComponent = getIconComponent(market.icon);
              return (
                <Card 
                  key={market.name} 
                  className="bg-[var(--surf)]/60 border-[var(--brd)] hover:border-[var(--brd2)] transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${market.color}20` }}
                      >
                        <IconComponent 
                          className="w-5 h-5" 
                          style={{ color: market.color }} 
                        />
                      </div>
                      <div>
                        <CardTitle className="text-[var(--text)] text-lg">{market.name}</CardTitle>
                        <CardDescription className="text-[var(--dim)] text-sm">
                          {t(market.descKey)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t("wallets.customWallets")}</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#6EE000]" />
            </div>
          ) : wallets.length === 0 ? (
            <Card className="bg-[var(--surf)]/60 border-[var(--brd)] border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="w-12 h-12 text-[var(--dim)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--text)] mb-2">{t("wallets.noWallets")}</h3>
                <p className="text-[var(--dim)] text-center mb-4">
                  {t("wallets.noWalletsDescription")}
                </p>
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-[#6EE000] to-[#448aff] hover:from-[#6EE000] hover:to-[#3a7aff]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("wallets.createFirst")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => {
                const IconComponent = getIconComponent(wallet.icon || "wallet");
                return (
                  <Card 
                    key={wallet.id} 
                    className="bg-[var(--surf)]/60 border-[var(--brd)] hover:border-[var(--brd2)] transition-colors"
                    data-testid={`card-wallet-${wallet.id}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${wallet.color}20` }}
                          >
                            <IconComponent 
                              className="w-5 h-5" 
                              style={{ color: wallet.color || "#8B5CF6" }} 
                            />
                          </div>
                          <div>
                            <CardTitle className="text-[var(--text)] text-lg">{wallet.name}</CardTitle>
                            {wallet.description && (
                              <CardDescription className="text-[var(--dim)] text-sm line-clamp-2">
                                {wallet.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-[var(--dim)] hover:text-[var(--text)]"
                              data-testid={`menu-wallet-${wallet.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[var(--surf)] border-[var(--brd)]">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(wallet)}
                              className="text-[var(--dim)] focus:bg-[var(--surf)] cursor-pointer"
                              data-testid={`edit-wallet-${wallet.id}`}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              {t("wallets.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(wallet)}
                              className="text-[#FF1F3D] focus:bg-[var(--surf)] focus:text-[#FF1F3D] cursor-pointer"
                              data-testid={`delete-wallet-${wallet.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("wallets.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) { setEditingWallet(null); resetForm(); }}}>
        <DialogContent className="bg-[var(--card)] border-[var(--brd)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text)]">{t("wallets.editTitle")}</DialogTitle>
            <DialogDescription className="text-[var(--dim)]">
              {t("wallets.editDescription")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-[var(--text)]">{t("wallets.name")}</Label>
              <Input
                id="edit-name"
                placeholder={t("wallets.namePlaceholder")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)]"
                data-testid="input-edit-wallet-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-[var(--text)]">{t("wallets.description")}</Label>
              <Textarea
                id="edit-description"
                placeholder={t("wallets.descriptionPlaceholder")}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[var(--surf)] border-[var(--brd)] text-[var(--text)] resize-none"
                rows={3}
                data-testid="input-edit-wallet-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[var(--text)]">{t("wallets.color")}</Label>
              <div className="flex gap-2 flex-wrap">
                {WALLET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--card)] scale-110" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={t(`wallets.${color.key}`)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[var(--text)]">{t("wallets.icon")}</Label>
              <div className="flex gap-2 flex-wrap">
                {WALLET_ICONS.map((iconData) => {
                  const IconComponent = iconData.icon;
                  return (
                    <button
                      key={iconData.value}
                      onClick={() => setFormData({ ...formData, icon: iconData.value })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
                        formData.icon === iconData.value 
                          ? "border-[#6EE000] bg-[#6EE000]/20 text-[#6EE000]" 
                          : "border-[var(--brd)] bg-[var(--surf)] text-[var(--dim)] hover:border-[var(--brd2)]"
                      }`}
                      title={t(`wallets.${iconData.key}`)}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => { setIsEditOpen(false); setEditingWallet(null); resetForm(); }}
              className="border-[var(--brd)] text-[var(--dim)] hover:bg-[var(--surf)]"
            >
              {t("wallets.cancel")}
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-[#6EE000] to-[#448aff] hover:from-[#6EE000] hover:to-[#3a7aff]"
              data-testid="button-confirm-edit"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("wallets.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
