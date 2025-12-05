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
import type { Wallet as WalletType } from "@shared/schema";

const WALLET_COLORS = [
  { name: "Roxo", value: "#8B5CF6" },
  { name: "Azul", value: "#3B82F6" },
  { name: "Verde", value: "#10B981" },
  { name: "Amarelo", value: "#F59E0B" },
  { name: "Vermelho", value: "#EF4444" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Índigo", value: "#6366F1" },
  { name: "Ciano", value: "#06B6D4" },
];

const WALLET_ICONS = [
  { name: "Carteira", value: "wallet", icon: Wallet },
  { name: "Tendência", value: "trending", icon: TrendingUp },
  { name: "Crypto", value: "bitcoin", icon: Bitcoin },
  { name: "Dólar", value: "dollar", icon: DollarSign },
  { name: "Gráfico", value: "chart", icon: BarChart3 },
  { name: "Pasta", value: "folder", icon: FolderOpen },
];

function getIconComponent(iconValue: string) {
  const iconData = WALLET_ICONS.find(i => i.value === iconValue);
  return iconData?.icon || Wallet;
}

export default function Carteiras() {
  const { toast } = useToast();
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
        title: "Carteira criada!",
        description: "Sua nova carteira está pronta para uso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar carteira",
        description: error.message || "Tente novamente",
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
        title: "Carteira atualizada!",
        description: "As alterações foram salvas.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      setIsEditOpen(false);
      setEditingWallet(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar carteira",
        description: error.message || "Tente novamente",
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
        title: "Carteira deletada",
        description: "A carteira foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao deletar carteira",
        description: error.message || "Tente novamente",
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
        title: "Nome obrigatório",
        description: "Digite um nome para a carteira.",
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
        title: "Nome obrigatório",
        description: "Digite um nome para a carteira.",
      });
      return;
    }
    updateMutation.mutate({ id: editingWallet.id, data: formData });
  };

  const handleDelete = (wallet: WalletType) => {
    if (confirm(`Tem certeza que deseja deletar a carteira "${wallet.name}"?`)) {
      deleteMutation.mutate(wallet.id);
    }
  };

  const defaultMarkets = [
    { name: "Crypto", color: "#F59E0B", icon: "bitcoin", description: "Criptomoedas (BTC, ETH, etc)" },
    { name: "Forex", color: "#10B981", icon: "dollar", description: "Mercado de câmbio" },
    { name: "B3", color: "#3B82F6", icon: "chart", description: "Bolsa de valores brasileira" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carteiras</h1>
          <p className="text-gray-400 mt-1">
            Organize seus trades em carteiras personalizadas para melhor análise
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-create-wallet"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Carteira
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Nova Carteira</DialogTitle>
              <DialogDescription className="text-gray-400">
                Crie uma carteira personalizada para organizar seus trades
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Nome</Label>
                <Input
                  id="name"
                  placeholder="Ex: Prop Firm FTMO, Scalping BTC..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  data-testid="input-wallet-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o propósito desta carteira..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white resize-none"
                  rows={3}
                  data-testid="input-wallet-description"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {WALLET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-all ${
                        formData.color === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                      data-testid={`color-${color.value}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Ícone</Label>
                <div className="flex gap-2 flex-wrap">
                  {WALLET_ICONS.map((iconData) => {
                    const IconComponent = iconData.icon;
                    return (
                      <button
                        key={iconData.value}
                        onClick={() => setFormData({ ...formData, icon: iconData.value })}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
                          formData.icon === iconData.value 
                            ? "border-purple-500 bg-purple-500/20 text-purple-400" 
                            : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                        }`}
                        title={iconData.name}
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
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                data-testid="button-confirm-create"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Carteira
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Mercados Padrão</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {defaultMarkets.map((market) => {
              const IconComponent = getIconComponent(market.icon);
              return (
                <Card 
                  key={market.name} 
                  className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
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
                        <CardTitle className="text-white text-lg">{market.name}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm">
                          {market.description}
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
          <h2 className="text-lg font-semibold text-white mb-4">Suas Carteiras Personalizadas</h2>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : wallets.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">Nenhuma carteira criada</h3>
                <p className="text-gray-400 text-center mb-4">
                  Crie carteiras personalizadas para organizar seus trades por estratégia, conta ou projeto
                </p>
                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Carteira
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
                    className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors"
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
                            <CardTitle className="text-white text-lg">{wallet.name}</CardTitle>
                            {wallet.description && (
                              <CardDescription className="text-gray-400 text-sm line-clamp-2">
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
                              className="text-gray-400 hover:text-white"
                              data-testid={`menu-wallet-${wallet.id}`}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(wallet)}
                              className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                              data-testid={`edit-wallet-${wallet.id}`}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(wallet)}
                              className="text-red-400 focus:bg-gray-700 focus:text-red-400 cursor-pointer"
                              data-testid={`delete-wallet-${wallet.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deletar
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
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Carteira</DialogTitle>
            <DialogDescription className="text-gray-400">
              Atualize as informações da sua carteira
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-300">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Prop Firm FTMO, Scalping BTC..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                data-testid="input-edit-wallet-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-gray-300">Descrição (opcional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Descreva o propósito desta carteira..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white resize-none"
                rows={3}
                data-testid="input-edit-wallet-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {WALLET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color.value ? "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110" : ""
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-300">Ícone</Label>
              <div className="flex gap-2 flex-wrap">
                {WALLET_ICONS.map((iconData) => {
                  const IconComponent = iconData.icon;
                  return (
                    <button
                      key={iconData.value}
                      onClick={() => setFormData({ ...formData, icon: iconData.value })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all border ${
                        formData.icon === iconData.value 
                          ? "border-purple-500 bg-purple-500/20 text-purple-400" 
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                      }`}
                      title={iconData.name}
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
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-confirm-edit"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
