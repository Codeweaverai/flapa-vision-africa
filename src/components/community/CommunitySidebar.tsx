import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserFollowButton } from './UserFollowButton';
import { Crown, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  role: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export const CommunitySidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile();
      fetchSuggestedUsers();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        const [followersResult, followingResult] = await Promise.all([
          supabase.from('community_followers').select('id').eq('following_id', user.id),
          supabase.from('community_followers').select('id').eq('follower_id', user.id)
        ]);

        setCurrentUserProfile({
          ...profile,
          followers_count: followersResult.data?.length || 0,
          following_count: followingResult.data?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, role')
        .neq('id', user.id)
        .limit(8);

      if (profiles) {
        const userIds = profiles.map(p => p.id);
        
        const [followersData, followingData] = await Promise.all([
          supabase
            .from('community_followers')
            .select('following_id')
            .in('following_id', userIds),
          supabase
            .from('community_followers')
            .select('following_id')
            .eq('follower_id', user.id)
            .in('following_id', userIds)
        ]);

        const followingSet = new Set(followingData.data?.map(f => f.following_id));
        const followersCountMap = new Map<string, number>();
        
        followersData.data?.forEach(f => {
          followersCountMap.set(f.following_id, (followersCountMap.get(f.following_id) || 0) + 1);
        });

        const enrichedProfiles = profiles.map(profile => ({
          ...profile,
          followers_count: followersCountMap.get(profile.id) || 0,
          is_following: followingSet.has(profile.id)
        }));

        // Sort by followers count
        enrichedProfiles.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));

        setSuggestedUsers(enrichedProfiles);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setSuggestedUsers(prev => prev.map(u => 
      u.id === userId ? { 
        ...u, 
        is_following: isFollowing,
        followers_count: (u.followers_count || 0) + (isFollowing ? 1 : -1)
      } : u
    ));
    fetchCurrentUserProfile();
  };

  const isCreator = (role: string) => role === 'creator' || role === 'admin';

  if (!user || loading) {
    return (
      <div className="w-80 space-y-4">
        <Card className="bg-white/80 backdrop-blur border-none shadow-lg animate-pulse">
          <CardContent className="p-6">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-80 space-y-4 sticky top-20">
      {/* Current User Profile */}
      <Card className="bg-gradient-to-br from-orange-50 to-purple-50 border-none shadow-lg overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-orange-400 to-purple-600"></div>
        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col items-center">
            {/* ✅ UPDATED: Current user avatar with anchor tag */}
            <a href={`/creator/profile/${user.id}`} className="cursor-pointer">
              <Avatar className="w-20 h-20 ring-4 ring-white shadow-lg hover:ring-purple-200 transition-all">
                <AvatarImage src={currentUserProfile?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-600 text-white text-xl">
                  {currentUserProfile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </a>
            
            <div className="text-center mt-3 space-y-1">
              {/* ✅ UPDATED: Current user name with anchor tag */}
              <a 
                href={`/creator/profile/${user.id}`}
                className="font-bold text-gray-900 text-lg hover:text-purple-600 transition-colors cursor-pointer block"
              >
                {currentUserProfile?.full_name}
              </a>
              {/* ✅ UPDATED: Current username with anchor tag */}
              <a 
                href={`/creator/profile/${user.id}`}
                className="text-sm text-gray-600 hover:text-purple-600 transition-colors cursor-pointer block"
              >
                @{currentUserProfile?.username}
              </a>
              
              {currentUserProfile && (
                <Badge 
                  className={`mt-2 ${
                    isCreator(currentUserProfile.role)
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white border-none'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none'
                  }`}
                >
                  {isCreator(currentUserProfile.role) ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Creator
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      Member
                    </>
                  )}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 w-full">
              <div className="text-center">
                <p className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  {currentUserProfile?.followers_count || 0}
                </p>
                <p className="text-xs text-gray-600">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                  {currentUserProfile?.following_count || 0}
                </p>
                <p className="text-xs text-gray-600">Following</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discover People */}
      <Card className="bg-white/80 backdrop-blur border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Discover People
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestedUsers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No suggestions available</p>
          ) : (
            suggestedUsers.map((suggestedUser) => (
              <div 
                key={suggestedUser.id} 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all duration-200 group"
              >
                {/* ✅ UPDATED: Suggested user avatar with anchor tag */}
                <a href={`/creator/profile/${suggestedUser.id}`} className="cursor-pointer">
                  <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-purple-200 transition-all">
                    <AvatarImage src={suggestedUser.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                      {suggestedUser.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </a>
                
                <div className="flex-1 min-w-0">
                  {/* ✅ UPDATED: Suggested user name with anchor tag */}
                  <a 
                    href={`/creator/profile/${suggestedUser.id}`}
                    className="font-semibold text-sm text-gray-900 truncate hover:text-purple-600 transition-colors cursor-pointer block"
                  >
                    {suggestedUser.full_name}
                  </a>
                  <div className="flex items-center space-x-2">
                    {/* ✅ UPDATED: Suggested username with anchor tag */}
                    <a 
                      href={`/creator/profile/${suggestedUser.id}`}
                      className="text-xs text-gray-500 truncate hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      @{suggestedUser.username}
                    </a>
                    {isCreator(suggestedUser.role) && (
                      <Crown className="w-3 h-3 text-orange-500" />
                    )}
                  </div>
                  {suggestedUser.followers_count && suggestedUser.followers_count > 0 && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" />
                      {suggestedUser.followers_count}
                    </p>
                  )}
                </div>
                
                <UserFollowButton
                  userId={suggestedUser.id}
                  isFollowing={suggestedUser.is_following || false}
                  onFollowChange={handleFollowChange}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
