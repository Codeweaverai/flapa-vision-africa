
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Bot } from 'lucide-react';
import InboxComponent from './InboxComponent';
import AiChatComponent from './AiChatComponent';

const ModernInboxComponent = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/80 backdrop-blur-sm border border-orange-200">
          <TabsTrigger 
            value="messages" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger 
            value="ai-chat"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            AI Smart Advisor
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="mt-0">
          <InboxComponent />
        </TabsContent>
        
        <TabsContent value="ai-chat" className="mt-0">
          <div className="grid grid-cols-1 gap-6 h-[600px]">
            <AiChatComponent />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModernInboxComponent;
