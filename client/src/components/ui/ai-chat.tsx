import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ScrollArea } from "./scroll-area";
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onMinimize: () => void;
}

export function AIChat({ isOpen, onToggle, isMinimized, onMinimize }: AIChatProps) {
  const { t, language } = useLanguage();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: t('ai.welcome_message'),
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', { message, language });
      return response.json();
    },
    onSuccess: (response) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: response.reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: t('ai.error_message'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black hover:bg-gray-800 border border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        data-testid="button-open-ai-chat"
      >
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bg-black/95 border-gray-600 shadow-2xl z-50 transition-all duration-300 ${
      isMinimized 
        ? 'bottom-4 right-4 md:bottom-6 md:right-6 w-72 md:w-80 h-14 md:h-16' 
        : 'bottom-4 right-4 left-4 md:bottom-6 md:right-6 md:left-auto w-auto md:w-96 h-[70vh] md:h-[500px] max-h-[600px]'
    }`}>
      <CardHeader className="p-3 md:p-4 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white text-sm md:text-base">
            <Bot className="h-4 w-4 md:h-5 md:w-5 text-white" />
            <span className="hidden sm:inline">{t('ai.chat_title')}</span>
            <span className="sm:hidden">{t('ai.chat_title_short')}</span>
            {chatMutation.isPending && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
              data-testid="button-minimize-chat"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[calc(70vh-73px)] md:h-[calc(500px-73px)]">
          <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 md:gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[80%] p-2 md:p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-700 text-white'
                    }`}
                    data-testid={`message-${message.type}-${message.id}`}
                  >
                    <p className="text-xs md:text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] md:text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.type === 'user' && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-2 md:gap-3 justify-start">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </div>
                  <div className="bg-gray-700 text-white p-2 md:p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 md:p-4 border-t border-gray-600">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('ai.input_placeholder')}
                className="bg-gray-800 border-gray-600 text-white text-sm md:text-base"
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isPending}
                className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 md:px-4"
                data-testid="button-send-message"
              >
                <Send className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}