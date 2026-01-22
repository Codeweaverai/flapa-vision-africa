import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Trash2, User, Search, MoreVertical, ArrowLeft, Paperclip, Smile, MessageSquare, UserPlus, Download, FileText, Image } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_creator?: boolean;
  role?: string;
}

interface UserOnlineStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  updated_at: string;
}

interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string;
  subject: string;
  content: string;
  message_type: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
  updated_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  sender_profile?: Profile | null;
}

interface Conversation {
  user_id: string;
  user_profile?: Profile;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online?: boolean;
  is_broadcast?: boolean;
  is_support?: boolean;
  is_system?: boolean;
}

const EnhancedInboxComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [onlineStatus, setOnlineStatus] = useState<Map<string, UserOnlineStatus>>(new Map());
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // Initialize user online status
  useEffect(() => {
    if (user) {
      initializeOnlineStatus();
      fetchMessages();
      const cleanup = setupRealtimeSubscriptions();

      return () => {
        cleanup();
        if (user) {
          handleUserOffline();
        }
      };
    }
  }, [user]);

  const initializeOnlineStatus = async () => {
    if (!user) return;

    try {
      // First, check if the user already has an online status record
      const { data: existingStatus, error: fetchError } = await supabase
        .from('user_online_status')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching online status:', fetchError);
        return;
      }

      if (existingStatus) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_online_status')
          .update({
            is_online: true,
            last_seen: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating online status:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_online_status')
          .insert({
            user_id: user.id,
            is_online: true,
            last_seen: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error inserting online status:', insertError);
        }
      }

      // Load initial online status for all users
      const { data: allStatus, error } = await supabase
        .from('user_online_status')
        .select('*');

      if (!error && allStatus) {
        const statusMap = new Map<string, UserOnlineStatus>();
        allStatus.forEach(status => {
          statusMap.set(status.user_id, status);
        });
        setOnlineStatus(statusMap);
      }
    } catch (error) {
      console.error('Error in initializeOnlineStatus:', error);
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_online_status')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating online status:', error);
      }
    } catch (error) {
      console.error('Error in updateOnlineStatus:', error);
    }
  };

  const handleUserOffline = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_online_status')
        .update({
          is_online: false,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error setting user offline:', error);
      }
    } catch (error) {
      console.error('Error in handleUserOffline:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Debounced function to prevent excessive updates
    let fetchTimeout: NodeJS.Timeout | null = null;

    const debouncedFetchMessages = () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      fetchTimeout = setTimeout(() => {
        fetchMessages();
        if (selectedConversation) {
          loadConversationMessages(selectedConversation);
        }
      }, 100); // 100ms debounce
    };

    // Messages subscription
    const messagesChannel = supabase
      .channel('inbox_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'inbox_messages',
        filter: `recipient_id=eq.${user.id}`
      }, debouncedFetchMessages)
      .subscribe();

    // Online status subscription
    const statusChannel = supabase
      .channel('online_status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_online_status'
      }, (payload) => {
        setOnlineStatus(prev => {
          const newMap = new Map(prev);
          const status = payload.new as UserOnlineStatus;
          newMap.set(status.user_id, status);
          return newMap;
        });

        // Refresh conversations to update online status
        debouncedFetchMessages();
      })
      .subscribe();

    // Handle page visibility for online status
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    // Handle beforeunload for when user closes tab/window
    const handleBeforeUnload = () => {
      handleUserOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (fetchTimeout) {
        clearTimeout(fetchTimeout);
      }
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(statusChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      setLoadingMessages(true);
      setLoadingProgress(0);

      // Simulate loading progress
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Concurrent data fetching for better performance
      const [messagesResult, profilesResult] = await Promise.allSettled([
        // Fetch messages
        supabase
          .from('inbox_messages')
          .select('*')
          .eq('recipient_id', user.id)
          .order('created_at', { ascending: false }),

        // Fetch user profiles concurrently
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_creator, role')
      ]);

      if (messagesResult.status === 'rejected') {
        console.error('Error fetching messages:', messagesResult.reason);
        clearInterval(progressInterval);
        setLoadingMessages(false);
        return;
      }

      const { data: messagesData, error: messagesError } = messagesResult.value;
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        clearInterval(progressInterval);
        setLoadingMessages(false);
        return;
      }

      setLoadingProgress(95);

      // Group messages into conversations
      const conversationMap = new Map<string, Conversation>();

      for (const message of messagesData || []) {
        let conversationKey: string;
        let isSpecialType = false;

        if (message.message_type === 'broadcast' || (message.sender_id === null && message.subject?.startsWith('[BROADCAST]'))) {
          conversationKey = 'broadcast_messages';
          isSpecialType = true;
        } else if (message.message_type === 'support' || message.subject?.includes('Support')) {
          conversationKey = 'admin_support';
          isSpecialType = true;
        } else if (message.message_type === 'system' || (message.sender_id === null && !message.subject?.startsWith('[BROADCAST]'))) {
          // System messages from triggers
          conversationKey = 'system_updates';
          isSpecialType = true;
        } else if (message.sender_id) {
          conversationKey = message.sender_id;
        } else {
          continue;
        }

        if (!conversationMap.has(conversationKey)) {
          if (isSpecialType) {
            conversationMap.set(conversationKey, {
              user_id: conversationKey,
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: 0,
              is_broadcast: conversationKey === 'broadcast_messages',
              is_support: conversationKey === 'admin_support',
              is_system: conversationKey === 'system_updates'
            });
          } else {
            const userStatus = onlineStatus.get(conversationKey);
            conversationMap.set(conversationKey, {
              user_id: conversationKey,
              last_message: message.content,
              last_message_time: message.created_at,
              unread_count: 0,
              is_online: userStatus?.is_online || false
            });
          }
        }

        if (!message.is_read) {
          const conv = conversationMap.get(conversationKey)!;
          conv.unread_count += 1;
        }
      }

      const conversationList = Array.from(conversationMap.values());

      // Load user profiles for regular conversations
      const userIds = conversationList
        .filter(c => !c.is_broadcast && !c.is_support && !c.is_system)
        .map(c => c.user_id);

      if (userIds.length > 0 && profilesResult.status === 'fulfilled') {
        const { data: profilesData, error: profilesError } = profilesResult.value;

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          conversationList.forEach(conv => {
            if (!conv.is_broadcast && !conv.is_support && !conv.is_system) {
              const profile = profilesData?.find(p => p.id === conv.user_id);
              if (profile) {
                conv.user_profile = profile;
                // Update online status from the status map
                const userStatus = onlineStatus.get(conv.user_id);
                conv.is_online = userStatus?.is_online || false;
              }
            }
          });
        }
      }

      setLoadingProgress(100);

      // Sort by last message time
      conversationList.sort((a, b) =>
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      );

      setConversations(conversationList);
      setMessages(messagesData || []);

      // Complete loading after a short delay
      setTimeout(() => {
        setLoadingMessages(false);
      }, 300);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast.error('Failed to load messages');
      setLoadingMessages(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (!user) return;

    try {
      let query;

      if (conversationId === 'broadcast_messages') {
        query = supabase
          .from('inbox_messages')
          .select('*')
          .eq('recipient_id', user.id)
          .or('message_type.eq.broadcast,subject.ilike.%[BROADCAST]%');
      } else if (conversationId === 'admin_support') {
        query = supabase
          .from('inbox_messages')
          .select('*')
          .eq('recipient_id', user.id)
          .or('message_type.eq.support,subject.ilike.%Support%');
      } else if (conversationId === 'system_updates') {
        query = supabase
          .from('inbox_messages')
          .select('*')
          .eq('recipient_id', user.id)
          .eq('message_type', 'system');
      } else {
        query = supabase
          .from('inbox_messages')
          .select('*')
          .or(`and(sender_id.eq.${conversationId},recipient_id.eq.${user.id}),and(sender_id.eq.${user.id},recipient_id.eq.${conversationId})`);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching conversation messages:', error);
        return;
      }

      // Load sender profiles with concurrent requests
      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (message) => {
          if (!message.sender_id) {
            return { ...message, sender_profile: null };
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, is_creator, role')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            sender_profile: profile
          };
        })
      );

      setConversationMessages(messagesWithProfiles);

      // Mark unread messages as read
      const unreadMessages = data?.filter(m =>
        !m.is_read && m.recipient_id === user.id
      );

      if (unreadMessages && unreadMessages.length > 0) {
        await supabase
          .from('inbox_messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map(m => m.id));

        fetchMessages(); // Refresh conversations
      }
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('inbox-files')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file');
        return;
      }

      const { data } = supabase.storage
        .from('inbox-files')
        .getPublicUrl(fileName);

      // Send message with file attachment
      if (selectedConversation) {
        await sendMessageWithFile(data.publicUrl, file.name, file.type);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const sendMessageWithFile = async (fileUrl: string, fileName: string, fileType: string) => {
    if (!user || !selectedConversation) return;

    try {
      const recipientId = selectedConversation === 'broadcast_messages' || selectedConversation === 'admin_support'
        ? selectedConversation
        : selectedConversation;

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId === 'broadcast_messages' || recipientId === 'admin_support' ? user.id : recipientId,
          subject: 'File Attachment',
          content: `Shared a file: ${fileName}`,
          message_type: 'direct',
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType
        });

      if (error) {
        console.error('Error sending file message:', error);
        toast.error('Failed to send file');
        return;
      }

      toast.success('File sent successfully');
      loadConversationMessages(selectedConversation);
      fetchMessages();
    } catch (error) {
      console.error('Error in sendMessageWithFile:', error);
      toast.error('Failed to send file');
    }
  };

  const sendReply = async () => {
    if (!user || !selectedConversation || !replyContent.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      let recipientId = selectedConversation;
      let messageType = 'direct';

      // Handle special conversation types
      if (selectedConversation === 'admin_support') {
        // Find admin users to send support message
        const { data: adminUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1);

        if (adminUsers && adminUsers.length > 0) {
          recipientId = adminUsers[0].id;
          messageType = 'support';
        }
      }

      const { error } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          subject: selectedConversation === 'admin_support' ? 'Support Request' : 'Message Reply',
          content: replyContent,
          message_type: messageType
        });

      if (error) {
        console.error('Error sending reply:', error);
        toast.error('Failed to send message');
        return;
      }

      setReplyContent('');
      loadConversationMessages(selectedConversation);
      fetchMessages();
    } catch (error) {
      console.error('Error in sendReply:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newContactUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('username', newContactUsername.trim())
        .single();

      if (error || !profile) {
        toast.error('User not found');
        return;
      }

      // Start a conversation by sending a welcome message
      const { error: messageError } = await supabase
        .from('inbox_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: profile.id,
          subject: 'New Contact',
          content: 'Hello! I added you as a contact.',
          message_type: 'direct'
        });

      if (messageError) {
        console.error('Error creating conversation:', messageError);
        toast.error('Failed to add contact');
        return;
      }

      toast.success('Contact added successfully');
      setNewContactUsername('');
      setShowAddContact(false);
      fetchMessages();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const getUserDisplayName = (profile?: Profile) => {
    if (!profile) return 'Unknown User';
    if (profile.full_name && profile.full_name.trim()) return profile.full_name;
    if (profile.username && profile.username.trim()) return profile.username;
    return 'User';
  };

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.is_broadcast) return 'Broadcast Messages';
    if (conversation.is_support) return 'Admin Support';
    if (conversation.is_system) return 'System Updates';
    return getUserDisplayName(conversation.user_profile);
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.is_broadcast) {
      return <MessageSquare className="w-6 h-6" />;
    }
    if (conversation.is_support) {
      return <User className="w-6 h-6" />;
    }
    if (conversation.is_system) {
      return <MessageSquare className="w-6 h-6" />;
    }
    return null;
  };

  const getAvatarUrl = (avatarUrl?: string) => {
    if (!avatarUrl) return undefined;

    // If it's already a full URL, return it
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }

    // If it's a storage path, construct the public URL
    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(avatarUrl);

    return data.publicUrl;
  };

  const getOnlineStatusText = (conversation: Conversation) => {
    if (conversation.is_broadcast) return 'System Messages';
    if (conversation.is_support) return 'Support Chat';
    if (conversation.is_system) return 'Automated Notifications';

    const status = onlineStatus.get(conversation.user_id);
    if (status?.is_online) {
      return 'Online';
    } else if (status?.last_seen) {
      return `Last seen ${format(new Date(status.last_seen), 'HH:mm')}`;
    }
    return 'Offline';
  };

  const renderFileAttachment = (message: Message) => {
    if (!message.file_url) return null;

    const isImage = message.file_type?.startsWith('image/');

    return (
      <div className={`mt-2 p-2 rounded-lg max-w-xs ${
        message.sender_id === user?.id ? 'bg-orange-100' : 'bg-purple-100'
      }`}>
        {isImage ? (
          <div className="space-y-2">
            <img
              src={message.file_url}
              alt={message.file_name || 'Image'}
              className="rounded max-w-full h-auto max-h-48 object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite loop
                target.src = `https://placehold.co/400x225/ff7b00/ffffff?text=${encodeURIComponent(message.file_name?.substring(0, 20) || 'File')}`;
              }}
            />
            <div className={`flex items-center gap-2 text-sm ${
              message.sender_id === user?.id ? 'text-orange-700' : 'text-purple-700'
            }`}>
              <Image className="w-4 h-4" />
              <span>{message.file_name}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileText className={`w-4 h-4 ${
              message.sender_id === user?.id ? 'text-orange-600' : 'text-purple-600'
            }`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                message.sender_id === user?.id ? 'text-orange-900' : 'text-purple-900'
              }`}>
                {message.file_name}
              </p>
              <p className={`text-xs ${
                message.sender_id === user?.id ? 'text-orange-700' : 'text-purple-700'
              }`}>
                {message.file_type}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(message.file_url, '_blank')}
              className={message.sender_id === user?.id ? 'text-orange-600 hover:bg-orange-200' : 'text-purple-600 hover:bg-purple-200'}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const filteredConversations = conversations.filter(conv =>
    getConversationDisplayName(conv).toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Please sign in to view your messages.</p>
        </CardContent>
      </Card>
    );
  }

  // Loading screen
  if (loadingMessages) {
    return (
      <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-purple-600 transition-all duration-300 ease-out animate-pulse"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="text-sm font-medium bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
            Loading Messages... {loadingProgress}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Conversations List */}
      <div className={`${
        isMobile ? (selectedConversation ? 'hidden' : 'w-full') : 'w-80'
      } border-r border-gray-200 flex flex-col`}>
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter username"
                    value={newContactUsername}
                    onChange={(e) => setNewContactUsername(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={addContact} className="flex-1">
                      Add Contact
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddContact(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? 'No conversations found' : 'No messages yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.user_id}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b ${
                  selectedConversation === conversation.user_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedConversation(conversation.user_id);
                  loadConversationMessages(conversation.user_id);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      {conversation.is_broadcast || conversation.is_support || conversation.is_system ? (
                        <AvatarFallback className={`text-white ${
                          conversation.is_system 
                            ? 'bg-gradient-to-r from-blue-400 to-indigo-500' 
                            : 'bg-gradient-to-r from-orange-400 to-purple-500'
                        }`}>
                          {getConversationAvatar(conversation)}
                        </AvatarFallback>
                       ) : (
                        <>
                          <AvatarImage 
                            src={getAvatarUrl(conversation.user_profile?.avatar_url)} 
                            alt={getUserDisplayName(conversation.user_profile)}
                          />
                          <AvatarFallback className="bg-gradient-to-r from-orange-400 to-purple-500 text-white font-semibold">
                            {(conversation.user_profile?.full_name?.[0] || 
                             conversation.user_profile?.username?.[0] || 
                             'U').toUpperCase()}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    {conversation.is_online && !conversation.is_broadcast && !conversation.is_support && !conversation.is_system && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {getConversationDisplayName(conversation)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(conversation.last_message_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs ml-2">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {getOnlineStatusText(conversation)}
                    </p>
                    
                    {conversation.user_profile?.is_creator && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Creator
                      </Badge>
                    )}
                    {conversation.is_broadcast && (
                      <Badge variant="outline" className="text-xs mt-1 bg-orange-50 text-orange-700">
                        Broadcast
                      </Badge>
                    )}
                    {conversation.is_support && (
                      <Badge variant="outline" className="text-xs mt-1 bg-purple-50 text-purple-700">
                        Support
                      </Badge>
                    )}
                    {conversation.is_system && (
                      <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700">
                        System
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${
        isMobile ? (selectedConversation ? 'w-full' : 'hidden') : 'flex-1'
      } flex flex-col`}>
        
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-purple-600 text-white flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversation(null)}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              
              <div className="relative">
                <Avatar className="w-10 h-10">
                  {selectedConversation === 'broadcast_messages' || selectedConversation === 'admin_support' || selectedConversation === 'system_updates' ? (
                    <AvatarFallback className="bg-white/20 text-white">
                      {selectedConversation === 'broadcast_messages' ? 
                        <MessageSquare className="w-5 h-5" /> : 
                        selectedConversation === 'system_updates' ?
                        <MessageSquare className="w-5 h-5" /> :
                        <User className="w-5 h-5" />
                      }
                    </AvatarFallback>
                   ) : (
                    <>
                      <AvatarImage 
                        src={getAvatarUrl(conversations.find(c => c.user_id === selectedConversation)?.user_profile?.avatar_url)}
                        alt={getUserDisplayName(conversations.find(c => c.user_id === selectedConversation)?.user_profile)}
                      />
                      <AvatarFallback className="bg-white/20 text-white font-semibold">
                        {(conversations.find(c => c.user_id === selectedConversation)?.user_profile?.full_name?.[0] || 
                         conversations.find(c => c.user_id === selectedConversation)?.user_profile?.username?.[0] || 
                         'U').toUpperCase()}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                {selectedConversation !== 'broadcast_messages' && 
                 selectedConversation !== 'admin_support' && 
                 selectedConversation !== 'system_updates' &&
                 onlineStatus.get(selectedConversation)?.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium">
                  {getConversationDisplayName(conversations.find(c => c.user_id === selectedConversation) || {} as Conversation)}
                </h3>
                <p className="text-sm text-white/80">
                  {getOnlineStatusText(conversations.find(c => c.user_id === selectedConversation) || {} as Conversation)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50" ref={scrollAreaRef}>
              <div className="space-y-4">
                {conversationMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Show avatar for incoming messages */}
                    {message.sender_id !== user?.id && message.sender_id !== null && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarImage 
                          src={getAvatarUrl(message.sender_profile?.avatar_url)}
                          alt={getUserDisplayName(message.sender_profile || undefined)}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-xs font-semibold">
                          {(message.sender_profile?.full_name?.[0] || 
                           message.sender_profile?.username?.[0] || 
                           'U').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {/* System message indicator */}
                    {message.sender_id === null && (
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white">
                          <MessageSquare className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="flex flex-col gap-1">
                      {/* Show sender name for incoming messages */}
                      {message.sender_id !== user?.id && (
                        <span className="text-xs font-medium text-muted-foreground px-2">
                          {message.sender_id === null 
                            ? 'System' 
                            : getUserDisplayName(message.sender_profile || undefined)}
                        </span>
                      )}
                      
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${
                          message.sender_id === user?.id
                            ? 'bg-orange-500 text-white rounded-br-md'
                            : message.sender_id === null && message.message_type === 'system'
                            ? 'bg-blue-500 text-white rounded-bl-md shadow-sm'
                            : 'bg-purple-500 text-white rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {renderFileAttachment(message)}
                        <p className="text-xs mt-1 text-white/80">
                          {format(new Date(message.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input - Disabled for system updates */}
            {selectedConversation !== 'system_updates' ? (
              <div className="p-4 border-t bg-white">
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={1}
                      className="resize-none border-0 bg-gray-100 rounded-full px-4 py-2 focus:ring-2 focus:ring-orange-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendReply();
                        }
                      }}
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={sendReply}
                    disabled={loading || !replyContent.trim()}
                    className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 rounded-full w-10 h-10 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t bg-gray-50 text-center text-sm text-muted-foreground">
                System updates are read-only automated notifications
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInboxComponent;
