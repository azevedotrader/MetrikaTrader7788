import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Edit3,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Eye,
  LogOut,
  MessageSquare,
  Clock,
  User,
  Send
} from "lucide-react";

// Admin-specific API request function
async function adminApiRequest(url: string, method: string = 'GET', data?: any) {
  const token = localStorage.getItem('adminToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }
  
  return await response.json();
}

// Schemas para formulários
const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).or(z.literal("")).optional(),
  phone: z.string().optional(),
  planType: z.enum(["free", "starter", "pro", "black"]).optional(),
  isActive: z.boolean().optional(),
});

const editPlanSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["free", "starter", "pro", "black"], {
    errorMap: () => ({ message: "Tipo deve ser: free, starter, pro ou black" })
  }),
  price: z.string().transform(Number),
  features: z.string().transform(val => val.split(',').map(f => f.trim())),
  maxTrades: z.string().optional().transform(val => val ? Number(val) : null),
  maxCsvImports: z.string().optional().transform(val => val ? Number(val) : null),
  hasApiAccess: z.boolean().default(false),
  hasAdvancedAnalytics: z.boolean().default(false),
});

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminAuthenticated, adminUser, adminLogout, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();

  // Admin queries with authentication - MOVED TO TOP TO FIX HOOKS ORDER
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => adminApiRequest("/api/admin/users"),
    enabled: isAdminAuthenticated,
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["/api/admin/plans"],
    queryFn: () => adminApiRequest("/api/admin/plans"),
    enabled: isAdminAuthenticated,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: () => adminApiRequest("/api/admin/stats"),
    enabled: isAdminAuthenticated,
  });

  // Forms
  const userForm = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      planType: "free",
      isActive: true,
    },
  });

  const planForm = useForm({
    resolver: zodResolver(editPlanSchema),
    defaultValues: {
      name: "",
      type: "",
      price: "0",
      features: "",
      maxTrades: "",
      maxCsvImports: "",
      hasApiAccess: false,
      hasAdvancedAnalytics: false,
    },
  });

  // Mutations with admin authentication
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApiRequest(`/api/admin/users/${id}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "Usuário atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) =>
      adminApiRequest(`/api/admin/users/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Usuário deletado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao deletar usuário", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Função de criação de planos removida - apenas 4 planos fixos permitidos

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApiRequest(`/api/admin/plans/${id}`, "PUT", data),
    onSuccess: () => {
      toast({ title: "Plano atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsPlanDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao atualizar plano", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Função de exclusão de planos removida - apenas 4 planos fixos permitidos

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAdminAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAdminAuthenticated, isLoading, setLocation]);

  // Handle logout
  const handleLogout = () => {
    adminLogout();
    toast({ title: "Logout realizado com sucesso" });
    setLocation('/admin/login');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Verificando autenticação...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAdminAuthenticated) {
    return null;
  }

  // Handle user edit
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      planType: user.planType,
      isActive: user.isActive,
    });
    setIsUserDialogOpen(true);
  };

  // Handle plan edit
  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    planForm.reset({
      name: plan.name,
      type: plan.type,
      price: plan.price.toString(),
      features: plan.features?.join(', ') || "",
      maxTrades: plan.maxTrades?.toString() || "",
      maxCsvImports: plan.maxCsvImports?.toString() || "",
      hasApiAccess: plan.hasApiAccess,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
    });
    setIsPlanDialogOpen(true);
  };

  // Submit handlers
  const onUserSubmit = (data: any) => {
    if (editingUser) {
      // Remove empty string fields to avoid unwanted updates
      const processedData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => value !== "")
      );
      updateUserMutation.mutate({ id: editingUser.id, data: processedData });
    }
  };

  const onPlanSubmit = (data: any) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      toast({ 
        title: "Erro", 
        description: "Apenas edição de planos existentes é permitida.", 
        variant: "destructive" 
      });
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'starter':
        return 'bg-green-100 text-green-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      case 'black':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent truncate">
            Painel Administrativo
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Gerencie usuários, planos e visualize estatísticas da plataforma
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
            Logado como: {adminUser?.name || adminUser?.email}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 sm:gap-4 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm sm:text-base"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
          <Shield className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-purple-600 flex-shrink-0" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            Usuários
          </TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm px-2 sm:px-4 py-2">
            Suporte
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl sm:text-2xl font-bold">
                  {statsLoading ? "..." : (stats as any)?.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats as any)?.activeUsers || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl sm:text-2xl font-bold">
                  R$ {statsLoading ? "..." : (stats as any)?.monthlyRevenue || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado nos planos ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total de Trades</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl sm:text-2xl font-bold">
                  {statsLoading ? "..." : (stats as any)?.totalTrades || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trades registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Planos Premium</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="pb-3">
                <div className="text-xl sm:text-2xl font-bold">
                  {statsLoading ? "..." : ((stats as any)?.proUsers || 0) + ((stats as any)?.blackUsers || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats as any)?.proUsers || 0} Pro + {(stats as any)?.blackUsers || 0} Black
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Starter</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-green-600 rounded" 
                        style={{ 
                          width: `${(stats as any)?.totalUsers > 0 ? ((stats as any)?.starterUsers / (stats as any)?.totalUsers) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(stats as any)?.starterUsers || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pro</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-blue-600 rounded" 
                        style={{ 
                          width: `${(stats as any)?.totalUsers > 0 ? ((stats as any)?.proUsers / (stats as any)?.totalUsers) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(stats as any)?.proUsers || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Black</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-purple-600 rounded" 
                        style={{ 
                          width: `${(stats as any)?.totalUsers > 0 ? ((stats as any)?.blackUsers / (stats as any)?.totalUsers) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(stats as any)?.blackUsers || 0}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Usuários</CardTitle>
                  <CardDescription>
                    Visualize todos os usuários da plataforma
                  </CardDescription>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('adminToken');
                      const response = await fetch('/api/admin/users/export', {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      if (!response.ok) throw new Error('Erro ao exportar');
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `usuarios-metrika-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      toast({
                        title: "Exportação concluída!",
                        description: "Arquivo CSV baixado com sucesso."
                      });
                    } catch (error) {
                      toast({
                        title: "Erro ao exportar",
                        description: "Não foi possível exportar os usuários.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-export-users-csv"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Usuários (CSV)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p>Carregando usuários...</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registrado</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(users as any)?.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phone || '-'}</TableCell>
                            <TableCell>
                              <Badge className={getPlanBadgeColor(user.planType)}>
                                {user.planType.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800">
                                  <UserX className="h-3 w-3 mr-1" />
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditUser(user)}
                                  className="h-8 w-8 p-0"
                                  data-testid={`button-edit-user-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteUserMutation.mutate(user.id)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-800"
                                  data-testid={`button-delete-user-${user.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {(users as any)?.map((user: any) => (
                      <Card key={user.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 p-0"
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-800"
                                data-testid={`button-delete-user-${user.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Telefone:</span>
                              <p className="font-medium">{user.phone || '-'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Plano:</span>
                              <div className="mt-1">
                                <Badge className={getPlanBadgeColor(user.planType)}>
                                  {user.planType.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <div className="mt-1">
                                {user.isActive ? (
                                  <Badge className="bg-green-100 text-green-800">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Ativo
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-100 text-red-800">
                                    <UserX className="h-3 w-3 mr-1" />
                                    Inativo
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Registrado:</span>
                              <p className="font-medium">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        {/* User Edit Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Faça alterações nos dados do usuário. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                <FormField
                  control={userForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do usuário" {...field} data-testid="input-user-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} data-testid="input-user-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} data-testid="input-user-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha (opcional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Deixe em branco para manter a atual" {...field} data-testid="input-user-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-user-plan">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Ativo</FormLabel>
                        <FormDescription>
                          Usuário pode acessar a plataforma
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-user-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUserDialogOpen(false)}
                    data-testid="button-cancel-user-edit"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-user-edit"
                  >
                    {updateUserMutation.isPending ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <SupportAdminPanel 
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
            adminMessage={adminMessage}
            setAdminMessage={setAdminMessage}
          />
        </TabsContent>

        
      </Tabs>
    </div>
  );
}

// Support Admin Panel Component
function SupportAdminPanel({ 
  selectedConversation, 
  setSelectedConversation, 
  adminMessage, 
  setAdminMessage 
}: {
  selectedConversation: string | null;
  setSelectedConversation: (id: string | null) => void;
  adminMessage: string;
  setAdminMessage: (message: string) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as conversas de suporte
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/admin/support/conversations'],
    queryFn: () => adminApiRequest('/api/admin/support/conversations'),
  });


  // Buscar mensagens da conversa selecionada
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/support/conversations', selectedConversation, 'messages'],
    queryFn: () => adminApiRequest(`/api/admin/support/conversations/${selectedConversation}/messages`),
    enabled: !!selectedConversation,
  });

  // Mutation para enviar resposta
  const sendReplyMutation = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      adminApiRequest(`/api/admin/support/conversations/${conversationId}/messages`, 'POST', { message }),
    onSuccess: () => {
      toast({ title: 'Resposta enviada com sucesso!' });
      setAdminMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/conversations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao enviar resposta', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Mutation para alterar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ conversationId, status }: { conversationId: string; status: string }) =>
      adminApiRequest(`/api/admin/support/conversations/${conversationId}/status`, 'PUT', { status }),
    onSuccess: () => {
      toast({ title: 'Status atualizado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support/conversations'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const handleSendReply = () => {
    if (!selectedConversation || !adminMessage.trim()) {
      toast({ 
        title: 'Erro', 
        description: 'Selecione uma conversa e digite uma mensagem',
        variant: 'destructive' 
      });
      return;
    }

    sendReplyMutation.mutate({ 
      conversationId: selectedConversation, 
      message: adminMessage.trim() 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gray-800 text-white';
      case 'in_progress': return 'bg-black text-white';
      case 'resolved': return 'bg-gray-700 text-white';
      case 'closed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-black text-white';
      case 'billing': return 'bg-gray-800 text-white';
      case 'feature': return 'bg-gray-700 text-white';
      case 'general': return 'bg-gray-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-black text-white';
      case 'medium': return 'bg-gray-800 text-white';
      case 'low': return 'bg-gray-700 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6 h-auto lg:h-[600px]">
      {/* Lista de Conversas */}
      <Card className="lg:col-span-1 order-1 lg:order-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm lg:text-base">
            <MessageSquare className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
            <span className="truncate">Conversas de Suporte</span>
          </CardTitle>
          <CardDescription className="text-xs lg:text-sm">
            {conversations.length} conversa(s) total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {conversationsLoading ? (
            <div className="p-4 text-sm">Carregando conversas...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm">
              Nenhuma conversa encontrada
            </div>
          ) : (
            <div className="max-h-[300px] lg:max-h-[400px] overflow-y-auto">
              {conversations.map((conversation: any) => (
                <div
                  key={conversation.id}
                  className={`p-3 lg:p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors border-blue-200 bg-[#21212199] ${
                    selectedConversation === conversation.id ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  {/* Título e Status */}
                  <div className="flex items-start justify-between mb-2 lg:mb-3">
                    <div className="flex-1 pr-2 min-w-0">
                      <h4 className="font-medium text-xs lg:text-sm truncate">{conversation.subject}</h4>
                      {conversation.firstUserMessage ? (
                        <p className="text-xs text-gray-600 mt-1 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxHeight: '2.4em',
                          lineHeight: '1.2em'
                        }}>
                          📝 {conversation.firstUserMessage}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-1 italic">Sem mensagem inicial</p>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(conversation.status)} text-xs px-2 py-1 flex-shrink-0`}>
                      {conversation.status}
                    </Badge>
                  </div>
                  
                  {/* Categoria e Prioridade */}
                  <div className="flex items-center gap-1 lg:gap-2 mb-2 lg:mb-3 flex-wrap">
                    <Badge className={`${getCategoryColor(conversation.category)} text-xs px-2 py-1`}>
                      {conversation.category}
                    </Badge>
                    <Badge className={`${getPriorityColor(conversation.priority)} text-xs px-2 py-1`}>
                      {conversation.priority}
                    </Badge>
                  </div>
                  
                  {/* Informações do usuário */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 lg:mb-2">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{conversation.userName} ({conversation.userEmail})</span>
                  </div>
                  
                  {/* Data da última mensagem */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span className="text-xs">{new Date(conversation.lastMessageAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Chat */}
      <Card className="lg:col-span-2 order-2 lg:order-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm lg:text-base mb-2 lg:mb-0">
            {selectedConversation ? 'Chat de Suporte' : 'Selecione uma Conversa'}
          </CardTitle>
          {selectedConversation && (
            <div className="flex flex-wrap gap-2 lg:gap-2 mt-2 lg:mt-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ conversationId: selectedConversation, status: 'in_progress' })}
                className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2 flex-1 sm:flex-none"
              >
                <span className="lg:hidden">Em Andamento</span>
                <span className="hidden lg:inline">Marcar em Andamento</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ conversationId: selectedConversation, status: 'resolved' })}
                className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2 flex-1 sm:flex-none"
              >
                <span className="lg:hidden">Resolvido</span>
                <span className="hidden lg:inline">Marcar como Resolvido</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatusMutation.mutate({ conversationId: selectedConversation, status: 'closed' })}
                className="text-xs lg:text-sm px-2 lg:px-3 py-1 lg:py-2 flex-1 sm:flex-none"
              >
                Fechar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col h-[350px] lg:h-[400px] overflow-hidden p-3 lg:p-6">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm lg:text-base text-center px-4">
              Selecione uma conversa para visualizar as mensagens
            </div>
          ) : (
            <>
              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto mb-3 lg:mb-4 space-y-3 lg:space-y-4 max-h-[250px] lg:max-h-[300px] p-1">
                {messagesLoading ? (
                  <div className="text-sm lg:text-base">Carregando mensagens...</div>
                ) : (
                  <>
                    {/* Primeira mensagem do usuário (contexto inicial) */}
                    {(() => {
                      const currentConversation = conversations.find((c: any) => c.id === selectedConversation);
                      if (currentConversation?.firstUserMessage) {
                        return (
                          <div className="flex justify-start mb-3 lg:mb-4">
                            <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%] lg:max-w-md">
                              <span className="text-xs text-gray-500 mb-1">Usuário (mensagem inicial)</span>
                              <div className="px-3 lg:px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-gray-900 rounded-bl-sm">
                                <p className="text-sm break-words">{currentConversation.firstUserMessage}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(currentConversation.createdAt).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {/* Outras mensagens */}
                    {messages.length === 0 ? (
                      <div className="text-gray-500 text-center text-sm lg:text-base">
                        {conversations.find((c: any) => c.id === selectedConversation)?.firstUserMessage 
                          ? "Aguardando resposta..." 
                          : "Nenhuma mensagem nesta conversa"
                        }
                      </div>
                    ) : (
                      messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromAdmin ? 'justify-end' : 'justify-start'} mb-3 lg:mb-4`}
                        >
                          <div className={`flex flex-col ${message.isFromAdmin ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] lg:max-w-md`}>
                            {/* Label de quem enviou */}
                            <span className="text-xs text-gray-500 mb-1">
                              {message.isFromAdmin ? 'Admin' : 'Usuário'}
                            </span>
                            {/* Mensagem */}
                            <div
                              className={`px-3 lg:px-4 py-2 rounded-lg ${
                                message.isFromAdmin
                                  ? 'bg-blue-600 text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm break-words">{message.message}</p>
                              <p className="text-xs mt-1 opacity-70">
                                {message.createdAt ? new Date(message.createdAt).toLocaleString('pt-BR') : 'Data não disponível'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              {/* Campo de resposta */}
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-2">
                <Input
                  placeholder="Digite sua resposta..."
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                  className="flex-1 text-sm lg:text-base"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={sendReplyMutation.isPending || !adminMessage.trim()}
                  className="flex items-center justify-center gap-2 text-sm lg:text-base px-4 lg:px-6 w-full sm:w-auto"
                >
                  <Send className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="sm:hidden lg:inline">Enviar</span>
                  <span className="hidden sm:inline lg:hidden">Enviar</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}