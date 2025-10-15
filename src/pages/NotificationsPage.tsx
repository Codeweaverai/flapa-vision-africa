import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Check, MessageCircle, Users, BookOpen, Calendar, Eye, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Notification, fetchUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/services/communityService';
import { supabase } from '@/lib/supabaseClient';

// Pulse Loading Component for Notifications
const NotificationsPulseLoading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96">
            {/* Pulse Animation Container */}
            <div className="relative w-40 h-40 flex items-center justify-center mb-8">
              {/* Outer Pulse Circle */}
              <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-orange-500/20 to-purple-600/20 animate-ping" />
              
              {/* Middle Pulse Circle */}
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-orange-500/30 to-purple-600/30 animate-pulse" />
              
              {/* Inner Pulse Circle */}
              <div className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-orange-500/40 to-purple-600/40 animate-pulse" />
              
              {/* Center Icon */}
              <div className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bell className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Loading Notifications
              </h3>
              <p className="text-muted-foreground text-lg">
                Getting your latest updates...
              </p>
            </div>

            {/* Progress Dots */}
            <div className="flex space-x-2 mt-6">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Use Pulse Loading component
  if (loading) {
    return <NotificationsPulseLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-white/90 backdrop-blur-sm shadow-xl">
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
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <p className="text-gray-600 font-medium">
                      {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''} waiting
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/community')}
                  className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 font-semibold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Community
                </Button>
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
            </div>
            
            {/* Notifications List */}
            {notifications.length === 0 ? (
              <Card className="p-12 text-center rounded-2xl shadow-xl border-0 bg-white/90 backdrop-blur-sm">
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
                  <Users className="h-5 w-5 mr-2" />
                  Explore Community
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`rounded-2xl shadow-xl border-0 transition-all duration-300 hover:shadow-2xl cursor-pointer transform hover:-translate-y-1 relative group bg-white/90 backdrop-blur-sm ${
                      !notification.is_read 
                        ? 'border-l-4 border-l-orange-500' 
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
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
                        
                        {/* Always Visible Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Community Navigation Button - Always Visible */}
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/community');
                            }}
                            className="bg-white/80 hover:bg-white border-orange-200 text-orange-600 hover:text-orange-700 rounded-xl transition-all duration-200"
                            title="Go to Community"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          
                          {/* Mark as Read Button - Always Visible for Unread Notifications */}
                          {!notification.is_read && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Status Indicator */}
                          {!notification.is_read ? (
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex-shrink-0 shadow-md ml-1"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-green-500 opacity-70 flex-shrink-0 ml-1"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Action Bar - Always Visible */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          Click to view in community
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/community');
                            }}
                            className="text-xs text-gray-600 hover:text-orange-600"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Community
                          </Button>
                          {!notification.is_read && (
                            <Button 
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="text-xs text-gray-600 hover:text-green-600"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Mark Read
                            </Button>
                          )}
                        </div>
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
