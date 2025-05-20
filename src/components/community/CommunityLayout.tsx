
import { ReactNode, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, MessageCircle, BookOpen, Bell } from 'lucide-react';

interface CommunityLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const CommunityLayout = ({ children, activeTab = 'feed', onTabChange }: CommunityLayoutProps) => {
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };

  return (
    <Layout>
      <div className="bg-light-purple min-h-screen pt-12 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gradient">Skillpulse Community</h1>
            <p className="text-lg mb-8">Connect with fellow learners, share insights, and grow together</p>

            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-8">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Community Feed</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </TabsTrigger>
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Course Discussions</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span>Notifications</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {children}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityLayout;
