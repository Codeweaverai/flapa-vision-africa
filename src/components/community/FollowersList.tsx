import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  getFollowers, 
  getFollowing, 
  FollowerProfile 
} from '@/services/communityFollowerService';
import { UserFollowButton } from './UserFollowButton';

interface FollowersListProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  isOpen,
  onClose,
  initialTab = 'followers'
}) => {
  const [followers, setFollowers] = useState<FollowerProfile[]>([]);
  const [following, setFollowing] = useState<FollowerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen && userId) {
      loadFollowData();
    }
  }, [isOpen, userId]);

  const loadFollowData = async () => {
    setLoading(true);
    try {
      const [followersData, followingData] = await Promise.all([
        getFollowers(userId),
        getFollowing(userId)
      ]);
      
      setFollowers(followersData);
      setFollowing(followingData);
    } catch (error) {
      console.error('Error loading follow data:', error);
      toast.error('Failed to load follow data');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    // Update the follow status in the lists
    setFollowers(prev => 
      prev.map(user => 
        user.id === targetUserId ? { ...user, is_following: isFollowing } : user
      )
    );
    setFollowing(prev => 
      prev.map(user => 
        user.id === targetUserId ? { ...user, is_following: isFollowing } : user
      )
    );
  };

  const renderUserList = (users: FollowerProfile[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="text-center p-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                  {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {user.full_name || user.username || 'Anonymous'}
                </p>
                {user.username && user.full_name && (
                  <p className="text-sm text-gray-500">@{user.username}</p>
                )}
              </div>
            </div>
            
            <UserFollowButton
              userId={user.id}
              isFollowing={false} // We'll need to fetch this data
              onFollowChange={handleFollowChange}
              variant="outline"
              size="sm"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Connections
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'followers' | 'following')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Followers
              <Badge variant="secondary" className="ml-1">
                {followers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Following
              <Badge variant="secondary" className="ml-1">
                {following.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followers" className="mt-4">
            {renderUserList(followers, "No followers yet")}
          </TabsContent>

          <TabsContent value="following" className="mt-4">
            {renderUserList(following, "Not following anyone yet")}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};