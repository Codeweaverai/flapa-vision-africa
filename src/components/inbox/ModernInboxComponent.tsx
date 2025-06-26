
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, Bot } from 'lucide-react';
import EnhancedInboxComponent from './EnhancedInboxComponent';
import AiChatComponent from './AiChatComponent';

const ModernInboxComponent = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gradient-to-r from-orange-100 to-purple-100 border border-orange-200">
          <TabsTrigger 
            value="messages" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white flex items-center gap-2 font-medium"
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger 
            value="ai-chat"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white flex items-center gap-2 font-medium"
          >
            <Bot className="h-4 w-4" />
            AI Smart Advisor
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="mt-0">
          <EnhancedInboxComponent />
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
