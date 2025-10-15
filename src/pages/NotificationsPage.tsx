import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Check, MessageCircle, Users, BookOpen, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Notification, fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/services/communityService';
import { supabase } from '@/lib/supabaseClient';

const NotificationsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNotification, setHoveredNotification] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  useEffect(() => {
    loadNotifications();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          loadNotifications();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      const success = await markAllNotificationsAsRead(user.id);
      if (success) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate to community page for all notifications
    navigate('/community');
  };

  const getNotificationIcon = (type: string) => {
    const gradientStyle = {
      background: 'linear-gradient(135deg, #FF6B35, #8A2BE2)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    };

    switch (type) {
      case 'message':
        return <MessageCircle className="h-6 w-6" style={gradientStyle} />;
      case 'course':
        return <BookOpen className="h-6 w-6" style={gradientStyle} />;
      case 'event':
        return <Calendar className="h-6 w-6" style={gradientStyle} />;
      case 'community':
        return <Users className="h-6 w-6" style={gradientStyle} />;
      default:
        return <Bell className="h-6 w-6" style={gradientStyle} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Layout>
        <div className="section-container py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-white shadow-lg">
                    <Bell className="h-8 w-8" style={{ 
                      background: 'linear-gradient(135deg, #FF6B35, #8A2BE2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }} />
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <p className="text-gray-600 font-medium">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''} waiting
                    </p>
                  )}
                </div>
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <Button 
                  onClick={handleMarkAllAsRead}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
            
            {/* Notifications List */}
            {loading ? (
              <Card className="p-8 text-center rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-transparent bg-gradient-to-r from-orange-500 to-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading notifications...</p>
              </Card>
            ) : notifications.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center">
                  <Bell className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">All caught up!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  You're all up to date! New notifications will appear here when you receive them.
                </p>
                <Button 
                  onClick={() => navigate('/community')}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Explore Community
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`rounded-2xl shadow-lg border-0 transition-all duration-300 hover:shadow-xl cursor-pointer transform hover:-translate-y-1 relative group ${
                      !notification.is_read 
                        ? 'bg-gradient-to-r from-orange-50 to-purple-50 border-l-4 border-l-orange-500' 
                        : 'bg-white/80 backdrop-blur-sm'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    onMouseEnter={() => setHoveredNotification(notification.id)}
                    onMouseLeave={() => setHoveredNotification(null)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-purple-100 flex items-center justify-center shadow-md">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-lg leading-relaxed ${
                            !notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <span className="text-sm font-medium px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md">
                              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              {format(new Date(notification.created_at), 'MMM d, yyyy • h:mm a')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Optional Mark as Read Button - Shows on Hover */}
                        {!notification.is_read && (
                          <div className={`flex items-center gap-2 transition-all duration-300 ${
                            hoveredNotification === notification.id 
                              ? 'opacity-100 translate-x-0' 
                              : 'opacity-0 translate-x-2'
                          }`}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="hover:bg-white/50 rounded-xl p-2 transition-all duration-200 border border-orange-200"
                              title="Mark as read"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white" />
                              </div>
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="hover:bg-white/50 rounded-xl p-2 transition-all duration-200"
                              title="Mark as read"
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            </Button>
                          </div>
                        )}
                        
                        {/* Always visible status indicator */}
                        {!notification.is_read ? (
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 mt-2 flex-shrink-0 shadow-md"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-green-500 opacity-70 mt-2 flex-shrink-0"></div>
                        )}
                      </div>
                      
                      {/* Optional quick action bar that appears on hover */}
                      <div className={`flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100 transition-all duration-300 ${
                        hoveredNotification === notification.id && !notification.is_read
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 -translate-y-2 h-0 mt-0 pt-0 overflow-hidden'
                      }`}>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="text-xs bg-white/80 hover:bg-white border-orange-200 text-orange-600 hover:text-orange-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Mark Read
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/community')}
                          className="text-xs bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0"
                        >
                          View in Community
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default NotificationsPage;
