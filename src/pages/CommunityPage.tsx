
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import CommunityChat from '@/components/community/CommunityChat';
import DirectMessages from '@/components/community/DirectMessage';
import UserPresence from '@/components/community/UserPresence';
import { MessageSquare, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const CommunityPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-6">Community Forum</h1>
          <p className="text-xl mb-8">Please sign in to join the community discussions.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Community</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 mb-8">
            <TabsTrigger value="chat" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Group Chat</span>
            </TabsTrigger>
            <TabsTrigger value="dm" className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Direct Messages</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Online Users</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`md:col-span-${activeTab === 'users' ? '4' : '3'}`}>
              <TabsContent value="chat">
                <CommunityChat channel="general" />
              </TabsContent>
              
              <TabsContent value="dm">
                <DirectMessages />
              </TabsContent>
              
              <TabsContent value="users" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="md:col-span-4">
                  <UserPresence />
                </div>
              </TabsContent>
            </div>
            
            {activeTab !== 'users' && (
              <div className="hidden md:block">
                <UserPresence />
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CommunityPage;
