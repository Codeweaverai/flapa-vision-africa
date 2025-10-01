import { ReactNode } from 'react';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, MessageCircle, BookOpen, Bell } from 'lucide-react';
import { CommunitySidebar } from './CommunitySidebar';

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
      <div className="bg-gradient-to-br from-orange-50/50 via-purple-50/50 to-pink-50/50 min-h-screen">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Skillpulse Community
            </h1>
            <p className="text-gray-600">Connect, learn, and grow together</p>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex gap-6 w-full">
            {/* Left Sidebar */}
            <div className="hidden lg:block shrink-0">
              <CommunitySidebar />
            </div>

            {/* Main Feed Area - Increased width */}
            <div className="flex-1 min-w-0 lg:max-w-4xl mx-auto lg:mx-0">
              <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
                <TabsList className="w-full grid grid-cols-4 bg-white/80 backdrop-blur-sm border-none shadow-lg rounded-full p-1 mb-6">
                  <TabsTrigger 
                    value="feed" 
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Feed</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="chat" 
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Chat</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="courses" 
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Discuss</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Alerts</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                  {children}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CommunityLayout;
