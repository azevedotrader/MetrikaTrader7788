import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import { Plus, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Conversation {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: 'technical' | 'billing' | 'feature' | 'general';
  lastMessageAt: string;
  lastMessageByAdmin: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
}

export default function Suporte() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newConversation, setNewConversation] = useState({
    subject: "",
    category: "general",
    priority: "medium",
    message: ""
  });

  // Buscar conversas do usuário
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/support/conversations'],
    enabled: !!user
  });

  // Buscar mensagens da conversa selecionada
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/support/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation
  });

  // Cast das conversas e mensagens para os tipos corretos
  const typedConversations = conversations as Conversation[];
  const typedMessages = messages as Message[];

  // Mutation para criar nova conversa
  const createConversationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/support/conversations', data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: t('support.conversation_started'),
        description: t('support.conversation_started'),
      });
      setNewConversation({ subject: "", category: "general", priority: "medium", message: "" });
      setIsNewConversationOpen(false);
      setSelectedConversation(data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/support/conversations'] });
    },
    onError: () => {
      toast({
        title: t('support.error'),
        description: t('support.error'),
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar mensagem
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      const response = await apiRequest('POST', `/api/support/conversations/${conversationId}/messages`, { message });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify({ status: response.status, message: errorData.error || 'Erro desconhecido' }));
      }
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('support.message_sent'),
        description: t('support.message_sent'),
      });
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/support/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/support/conversations'] });
    },
    onError: (error: any) => {
      let errorInfo;
      try {
        errorInfo = JSON.parse(error.message);
      } catch {
        errorInfo = { status: 500, message: 'Erro desconhecido' };
      }

      if (errorInfo.status === 403) {
        // Conversa foi resolvida
        toast({
          title: "💚 Problema Resolvido",
          description: "Este suporte já foi resolvido! Para reportar um novo problema, clique em 'Novo Suporte' e descreva sua situação.",
          variant: "default",
        });
        // Limpar conversa selecionada para forçar usuário a criar nova
        setSelectedConversation(null);
        setNewMessage("");
      } else {
        toast({
          title: t('support.error'),
          description: errorInfo.message || t('support.error'),
          variant: "destructive",
        });
      }
    },
  });

  const handleCreateConversation = () => {
    if (!newConversation.subject.trim()) {
      toast({
        title: t('support.error'),
        description: "Assunto é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Cria a conversa sem mensagem inicial - usuário pode enviar mensagens no chat após criação
    createConversationMutation.mutate({
      subject: newConversation.subject,
      category: newConversation.category,
      priority: newConversation.priority,
      message: "Conversa iniciada" // Mensagem automática inicial
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      message: newMessage.trim()
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-600';
      case 'medium': return 'border-l-yellow-600';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('support.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="page-title">
          {t('support.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('support.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Conversas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('support.title')}</CardTitle>
              <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-new-conversation">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('support.new_conversation')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-[95vw] sm:max-w-md bg-background border max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="pb-3 sm:pb-4">
                    <DialogTitle className="text-lg sm:text-xl">{t('support.new_conversation')}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 sm:space-y-4 p-1">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">{t('support.subject_label')}</Label>
                      <Input
                        id="subject"
                        value={newConversation.subject}
                        onChange={(e) => setNewConversation({ ...newConversation, subject: e.target.value })}
                        placeholder={t('support.subject_placeholder')}
                        className="h-9 sm:h-10 text-sm"
                        data-testid="input-subject"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="category" className="text-sm font-medium">{t('support.category_label')}</Label>
                      <Select value={newConversation.category} onValueChange={(value) => setNewConversation({ ...newConversation, category: value })}>
                        <SelectTrigger data-testid="select-category" className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder={t('support.category_label')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">{t('support.category_technical')}</SelectItem>
                          <SelectItem value="billing">{t('support.category_billing')}</SelectItem>
                          <SelectItem value="feature">{t('support.category_feature')}</SelectItem>
                          <SelectItem value="general">{t('support.category_general')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">{t('support.priority_label')}</Label>
                      <Select value={newConversation.priority} onValueChange={(value) => setNewConversation({ ...newConversation, priority: value })}>
                        <SelectTrigger data-testid="select-priority" className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder={t('support.priority_label')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('support.priority_low')}</SelectItem>
                          <SelectItem value="medium">{t('support.priority_medium')}</SelectItem>
                          <SelectItem value="high">{t('support.priority_high')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1 text-sm sm:text-base">
                            Chat Direto com Admin
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-600 leading-relaxed">
                            Após criar este ticket, você poderá enviar mensagens diretamente para nossa equipe de suporte através do chat. 
                            Responderemos o mais rápido possível de acordo com a prioridade selecionada.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={handleCreateConversation} 
                      disabled={createConversationMutation.isPending}
                      className="w-full h-9 sm:h-10 text-sm sm:text-base font-medium"
                      data-testid="button-start-conversation"
                    >
                      {createConversationMutation.isPending ? t('support.loading') : t('support.start_conversation')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {typedConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">{t('support.no_conversations')}</p>
                    <p className="text-sm">{t('support.no_conversations_desc')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {typedConversations.map((conversation: Conversation) => (
                      <Card
                        key={conversation.id}
                        className={`cursor-pointer transition-colors border-l-4 ${getPriorityColor(conversation.priority)} ${
                          selectedConversation === conversation.id ? 'bg-accent' : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                        data-testid={`conversation-${conversation.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(conversation.status)}
                              <Badge variant={getStatusBadgeVariant(conversation.status)}>
                                {t(`support.status_${conversation.status}`)}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(conversation.lastMessageAt)}
                            </span>
                          </div>
                          <h3 className="font-medium text-sm line-clamp-2 mb-2">
                            {conversation.subject}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{t(`support.category_${conversation.category}`)}</span>
                            <span>{t(`support.priority_${conversation.priority}`)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Área de Chat */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">
                  {typedConversations.find((c: Conversation) => c.id === selectedConversation)?.subject}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-3 sm:p-6">
                {/* Banner para conversa resolvida */}
                {typedConversations.find((c: Conversation) => c.id === selectedConversation)?.status === 'resolved' && (
                  <div className="mb-3 sm:mb-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-1 text-sm sm:text-base">
                          💚 Problema Resolvido
                        </h4>
                        <p className="text-xs sm:text-sm text-green-700 dark:text-green-600 leading-relaxed mb-2">
                          Este suporte foi marcado como resolvido por nossa equipe. Você não pode mais enviar mensagens nesta conversa.
                        </p>
                        <p className="text-xs sm:text-sm text-green-700 dark:text-green-600 leading-relaxed">
                          <strong>Precisa de mais ajuda?</strong> Clique em "Novo Suporte" acima para reportar um novo problema.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto mb-3 sm:mb-4 max-h-[400px] sm:max-h-[500px]">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-4 p-1">
                      {typedMessages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`max-w-[90%] sm:max-w-[80%] rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 ${
                              message.isFromAdmin
                                ? 'bg-muted text-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="text-xs sm:text-sm break-words leading-relaxed">{message.message}</p>
                            <p className="text-[10px] sm:text-xs opacity-70 mt-0.5 sm:mt-1">
                              {formatDate(message.createdAt)}
                              {message.isFromAdmin && (
                                <span className="ml-2 font-medium">Admin</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={
                      typedConversations.find((c: Conversation) => c.id === selectedConversation)?.status === 'resolved'
                        ? "Conversa resolvida - Crie um novo suporte"
                        : t('support.message_placeholder')
                    }
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="h-9 sm:h-10 text-sm flex-1"
                    data-testid="input-new-message"
                    disabled={typedConversations.find((c: Conversation) => c.id === selectedConversation)?.status === 'resolved'}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={
                      !newMessage.trim() || 
                      sendMessageMutation.isPending || 
                      typedConversations.find((c: Conversation) => c.id === selectedConversation)?.status === 'resolved'
                    }
                    className="h-9 sm:h-10 px-3 sm:px-4 text-sm flex-shrink-0"
                    data-testid="button-send-message"
                  >
                    <span className="hidden sm:inline">{sendMessageMutation.isPending ? t('support.loading') : t('support.send_button')}</span>
                    <span className="sm:hidden">📤</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[700px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {typedConversations.length === 0 ? t('support.no_conversations') : 'Selecione uma conversa'}
                </p>
                <p className="text-sm">
                  {typedConversations.length === 0 ? t('support.no_conversations_desc') : 'Clique em uma conversa para visualizar as mensagens'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}