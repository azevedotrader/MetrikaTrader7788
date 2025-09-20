import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
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
        title: t('register.success_title'),
        description: t('register.success_description'),
      });
      form.reset();
      onOpenChange(false);
      onSwitchToLogin();
    },
    onError: (error: any) => {
      toast({
        title: t('register.error_title'),
        description: error.message || t('register.error_description'),
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
          <div className="w-36 h-36 md:w-32 md:h-32 sm:w-24 sm:h-24 gradient-purple-blue rounded-xl flex items-center justify-center mx-auto">
            <Logo variant="modal" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white">
              {t('register.title')}
            </DialogTitle>
            <p className="text-slate-400 mt-2">{t('register.subtitle')}</p>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300">{t('register.name_label')}</Label>
            <Input
              id="name"
              placeholder={t('register.name_placeholder')}
              {...form.register("name")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.name && (
              <p className="text-red-600 text-sm">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">{t('register.email_label')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('register.email_placeholder')}
              {...form.register("email")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.email && (
              <p className="text-red-600 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300">{t('register.phone_label')}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('register.phone_placeholder')}
              {...form.register("phone")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.phone && (
              <p className="text-red-600 text-sm">{form.formState.errors.phone.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">{t('register.password_label')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('register.password_placeholder')}
              {...form.register("password")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.password && (
              <p className="text-red-600 text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">{t('register.confirm_password_label')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('register.confirm_password_placeholder')}
              {...form.register("confirmPassword")}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-600 text-sm">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? t('register.loading_button') : t('register.submit_button')}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-slate-400">
            {t('register.already_have_account')}{" "}
            <Button 
              variant="link" 
              className="text-purple-400 hover:text-purple-300 p-0"
              onClick={onSwitchToLogin}
            >
              {t('register.login_link')}
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}