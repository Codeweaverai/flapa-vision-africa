
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const InboxIcon: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();

      try {
        // Set up realtime subscription for new messages with error handling
        const channel = supabase
          .channel('inbox_unread')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'inbox_messages',
            filter: `recipient_id=eq.${user.id}`
          }, () => {
            loadUnreadCount();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to inbox messages');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Error subscribing to inbox messages channel');
            }
          });

        return () => {
          try {
            supabase.removeChannel(channel);
          } catch (error) {
            console.error('Error removing inbox subscription:', error);
          }
        };
      } catch (error) {
        console.error('Error setting up inbox subscription:', error);
      }
    }
  }, [user]);

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('id')
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error loading unread count:', error);
        return;
      }

      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Network error in loadUnreadCount:', error);
      // Don't update count if there's a network error
    }
  };

  const handleClick = () => {
    navigate('/inbox');
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="relative hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 transition-all duration-200"
      onClick={handleClick}
    >
      <MessageCircle className="h-5 w-5 text-gray-600 hover:text-transparent hover:bg-gradient-to-r hover:from-orange-500 hover:to-purple-600 hover:bg-clip-text" />
      {unreadCount > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default InboxIcon;
