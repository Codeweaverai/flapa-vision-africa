
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search, User } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  full_name?: string;
}

interface UserListProps {
  onUserSelect: (user: Profile) => void;
  currentUserId: string;
}

const UserList: React.FC<UserListProps> = ({ onUserSelect, currentUserId }) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .neq('id', currentUserId)
          .order('username');
          
        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUserId]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const username = (user.username || '').toLowerCase();
    const fullName = (user.full_name || '').toLowerCase();
    
    return username.includes(searchLower) || fullName.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {filteredUsers.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            {searchTerm ? 'No users found' : 'No users available'}
          </p>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => onUserSelect(user)}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
            >
              <Avatar className="h-10 w-10">
                {user.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.username || 'User'} />
                ) : (
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <p className="font-medium">
                  {user.username || user.full_name || 'Anonymous'}
                </p>
                {user.username && user.full_name && (
                  <p className="text-xs text-muted-foreground">{user.full_name}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserList;
