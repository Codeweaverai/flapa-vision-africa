
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface UserPresence {
  userId: string;
  username?: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'offline';
  lastActive: string;
}

const UserPresence: React.FC = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  
  useEffect(() => {
    if (!user) return;

    // Function to update own presence
    const updatePresence = async () => {
      // Get user profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();
      
      return {
        userId: user.id,
        username: profile?.username,
        avatar_url: profile?.avatar_url,
        status: 'online',
        lastActive: new Date().toISOString()
      };
    };

    // Set up presence channel
    const channel = supabase.channel('online-users');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const formattedState: Record<string, UserPresence> = {};
        
        Object.keys(state).forEach(presence => {
          const userPresence = state[presence][0] as UserPresence;
          formattedState[userPresence.userId] = userPresence;
        });
        
        setOnlineUsers(formattedState);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const presence = await updatePresence();
          await channel.track(presence);
          
          // Update presence every minute
          const interval = setInterval(async () => {
            const presence = await updatePresence();
            await channel.track(presence);
          }, 60000);
          
          return () => clearInterval(interval);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const onlineUsersList = Object.values(onlineUsers);
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Online Users</span>
          <Badge variant="outline">{onlineUsersList.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {onlineUsersList.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p>No users online</p>
          </div>
        ) : (
          onlineUsersList.map(userPresence => (
            <div key={userPresence.userId} className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  {userPresence.avatar_url ? (
                    <AvatarImage src={userPresence.avatar_url} alt={userPresence.username || 'User'} />
                  ) : (
                    <AvatarFallback>
                      {(userPresence.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">
                  {userPresence.username || 'Anonymous'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userPresence.userId === user?.id ? 'You' : 'Online'}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default UserPresence;
