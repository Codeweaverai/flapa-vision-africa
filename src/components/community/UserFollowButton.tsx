import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { followUser, unfollowUser } from '@/services/communityFollowerService';
import { useAuth } from '@/contexts/AuthContext';

interface UserFollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  showCount?: boolean;
  followersCount?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const UserFollowButton: React.FC<UserFollowButtonProps> = ({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  showCount = false,
  followersCount = 0,
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show button for own profile
  if (!user || user.id === userId) {
    return null;
  }

  const handleFollowToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      let success = false;
      
      if (isFollowing) {
        success = await unfollowUser(userId);
        if (success) {
          setIsFollowing(false);
          onFollowChange?.(userId, false);
          toast.success('Unfollowed successfully');
        }
      } else {
        success = await followUser(userId);
        if (success) {
          setIsFollowing(true);
          onFollowChange?.(userId, true);
          toast.success('Following user');
        }
      }

      if (!success) {
        toast.error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (showCount && followersCount > 0) {
      return isFollowing 
        ? `Following (${followersCount})` 
        : `Follow (${followersCount})`;
    }
    return isFollowing ? 'Following' : 'Follow';
  };

  const getButtonIcon = () => {
    if (showCount) {
      return <Users className="h-4 w-4" />;
    }
    return isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />;
  };

  const getButtonVariant = () => {
    if (isFollowing) {
      return variant === 'default' ? 'outline' : variant;
    }
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`transition-all duration-200 ${
        isFollowing 
          ? 'hover:bg-red-50 hover:border-red-200 hover:text-red-600' 
          : 'bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-none'
      } ${className}`}
    >
      {!isLoading && getButtonIcon()}
      <span className="ml-2">{isLoading ? 'Loading...' : getButtonText()}</span>
    </Button>
  );
};