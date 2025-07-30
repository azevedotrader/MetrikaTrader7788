import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar conta");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conta criada com sucesso!",
        description: "Agora você pode fazer login com suas credenciais.",
      });
      form.reset();
      onOpenChange(false);
      onSwitchToLogin();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    registerMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader className="text-center space-y-4">
          <div className="w-16 h-16 gradient-purple-blue rounded-xl flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white">
              Criar Conta no Métrika
            </DialogTitle>
            <p className="text-slate-400 mt-2">Comece sua jornada de trading analytics</p>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">Nome Completo</Label>
            <Input
              id="name"
              placeholder="João Silva"
              {...form.register("name")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.name && (
              <p className="text-red-400 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...form.register("email")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.email && (
              <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.password && (
              <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.register("confirmPassword")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-400 text-sm">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-slate-400">
            Já tem conta?{" "}
            <Button 
              variant="link" 
              className="text-purple-400 hover:text-purple-300 p-0"
              onClick={onSwitchToLogin}
            >
              Fazer login
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}