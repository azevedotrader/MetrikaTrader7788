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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  Trash2, 
  Plus,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Settings,
  LogOut
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
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  planType: z.enum(["free", "premium", "vip"]).optional(),
  isActive: z.boolean().optional(),
  planExpiresAt: z.string().optional(),
});

const createPlanSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.string().min(1, "Tipo obrigatório"),
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

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdminAuthenticated, adminUser, adminLogout, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();

  // Redirect to admin login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAdminAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAdminAuthenticated, isLoading, setLocation]);

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

  const handleLogout = () => {
    adminLogout();
    toast({ title: "Logout realizado com sucesso" });
    setLocation('/admin/login');
  };

  // Admin queries with authentication
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
      planExpiresAt: "",
    },
  });

  const planForm = useForm({
    resolver: zodResolver(createPlanSchema),
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

  const createPlanMutation = useMutation({
    mutationFn: (data: any) =>
      adminApiRequest("/api/admin/plans", "POST", data),
    onSuccess: () => {
      toast({ title: "Plano criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
      setIsPlanDialogOpen(false);
      planForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao criar plano", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

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

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) =>
      adminApiRequest(`/api/admin/plans/${id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Plano deletado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/plans"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao deletar plano", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Handle user edit
  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      planType: user.planType,
      isActive: user.isActive,
      planExpiresAt: user.planExpiresAt ? 
        new Date(user.planExpiresAt).toISOString().split('T')[0] : "",
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
      updateUserMutation.mutate({ id: editingUser.id, data });
    }
  };

  const onPlanSubmit = (data: any) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'premium':
        return 'bg-blue-100 text-blue-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Painel Administrativo
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie usuários, planos e visualize estatísticas da plataforma
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Logado como: {adminUser?.name || adminUser?.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2"
            data-testid="button-admin-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          <Shield className="h-12 w-12 text-purple-600" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : (stats as any)?.totalUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats as any)?.activeUsers || 0} ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {statsLoading ? "..." : (stats as any)?.monthlyRevenue || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado nos planos ativos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Trades</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : (stats as any)?.totalTrades || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trades registrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planos Premium</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : ((stats as any)?.premiumUsers || 0) + ((stats as any)?.vipUsers || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats as any)?.premiumUsers || 0} Premium + {(stats as any)?.vipUsers || 0} VIP
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gratuito</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-gray-400 rounded" 
                        style={{ 
                          width: `${(stats as any)?.totalUsers > 0 ? ((stats as any)?.freeUsers / (stats as any)?.totalUsers) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(stats as any)?.freeUsers || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Premium</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-blue-500 rounded" 
                        style={{ 
                          width: `${(stats as any)?.totalUsers > 0 ? ((stats as any)?.premiumUsers / (stats as any)?.totalUsers) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(stats as any)?.premiumUsers || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">VIP</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded">
                      <div 
                        className="h-full bg-purple-500 rounded" 
                        style={{ 
                          width: `${(stats as any)?.totalUsers > 0 ? ((stats as any)?.vipUsers / (stats as any)?.totalUsers) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(stats as any)?.vipUsers || 0}</span>
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
              <CardTitle className="flex items-center justify-between">
                <span>Gerenciamento de Usuários</span>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </CardTitle>
              <CardDescription>
                Visualize e gerencie todos os usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <p>Carregando usuários...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
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
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* User Edit Dialog */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription>
                  Faça alterações nas informações do usuário
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
                          <Input {...field} />
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
                          <Input type="email" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um plano" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="free">Gratuito</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="vip">VIP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="planExpiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Expiração do Plano</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUserDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gerenciamento de Planos</span>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingPlan(null);
                  planForm.reset();
                  setIsPlanDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Plano
                </Button>
              </CardTitle>
              <CardDescription>
                Configure os planos de assinatura disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <p>Carregando planos...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Max Trades</TableHead>
                      <TableHead>API Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(plans as any)?.map((plan: any) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>
                          <Badge className={getPlanBadgeColor(plan.type)}>
                            {plan.type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>R$ {plan.price}</TableCell>
                        <TableCell>{plan.maxTrades || "Ilimitado"}</TableCell>
                        <TableCell>
                          {plan.hasApiAccess ? (
                            <Badge className="bg-green-100 text-green-800">Sim</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={plan.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {plan.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deletePlanMutation.mutate(plan.id)}
                              disabled={deletePlanMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Plan Dialog */}
          <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </DialogTitle>
                <DialogDescription>
                  Configure os detalhes do plano de assinatura
                </DialogDescription>
              </DialogHeader>
              <Form {...planForm}>
                <form onSubmit={planForm.handleSubmit(onPlanSubmit)} className="space-y-4">
                  <FormField
                    control={planForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Plano</FormLabel>
                        <FormControl>
                          <Input placeholder="Premium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <Input placeholder="premium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={planForm.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recursos (separados por vírgula)</FormLabel>
                        <FormControl>
                          <Input placeholder="Trades ilimitados, Suporte prioritário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPlanDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                    >
                      {(createPlanMutation.isPending || updatePlanMutation.isPending) ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações da Plataforma
              </CardTitle>
              <CardDescription>
                Configurações gerais do sistema administrativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Atualizar Estatísticas</h3>
                    <p className="text-sm text-gray-600">
                      Recalcular estatísticas da plataforma
                    </p>
                  </div>
                  <Button variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Backup dos Dados</h3>
                    <p className="text-sm text-gray-600">
                      Fazer backup dos dados da plataforma
                    </p>
                  </div>
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Backup
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Logs do Sistema</h3>
                    <p className="text-sm text-gray-600">
                      Visualizar logs de atividade
                    </p>
                  </div>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}