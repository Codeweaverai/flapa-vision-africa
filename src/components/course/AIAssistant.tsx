
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  lessonTitle?: string;
  lessonContent?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ lessonTitle, lessonContent }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your AI learning assistant. I'm here to help you understand "${lessonTitle || 'this lesson'}" better. Feel free to ask me any questions!`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response (in a real implementation, this would call an AI service)
      const context = `Lesson: ${lessonTitle}\nContent: ${lessonContent || 'No additional content provided'}`;
      
      // Mock AI response based on the question
      const generateResponse = (question: string) => {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('summary') || lowerQuestion.includes('summarize')) {
          return `Based on the lesson "${lessonTitle}", here's a summary: This lesson covers important concepts that will help you understand the topic better. The key points include practical applications and theoretical foundations.`;
        } else if (lowerQuestion.includes('example') || lowerQuestion.includes('examples')) {
          return `Great question! Here are some examples related to "${lessonTitle}": These concepts can be applied in real-world scenarios to solve practical problems.`;
        } else if (lowerQuestion.includes('help') || lowerQuestion.includes('explain')) {
          return `I'd be happy to help explain concepts from "${lessonTitle}". The lesson focuses on building your understanding through step-by-step explanations and practical examples.`;
        } else {
          return `That's an interesting question about "${lessonTitle}". Based on the lesson content, I can help you understand this topic better. Could you be more specific about what aspect you'd like me to explain?`;
        }
      };

      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: generateResponse(inputMessage),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast.error('Failed to get AI response');
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-purple-600" />
          AI Learning Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col h-[calc(100%-80px)]">
        <ScrollArea className="flex-1 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                
                <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[85%] p-3 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me anything about this lesson..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAssistant;
