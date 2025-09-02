import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  itemId: string;
  itemType: 'course' | 'event';
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  itemId,
  itemType,
  variant = 'ghost',
  size = 'icon',
  className
}) => {
  const { addToWishlist, removeFromWishlist, isInWishlist, loading } = useWishlist();
  const inWishlist = isInWishlist(itemId, itemType);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      await removeFromWishlist(itemId, itemType);
    } else {
      await addToWishlist(itemId, itemType);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'transition-colors',
        inWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      <Heart 
        className={cn(
          'h-4 w-4',
          inWishlist && 'fill-current'
        )} 
      />
      {size !== 'icon' && (
        <span className="ml-2">
          {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </Button>
  );
};

export default WishlistButton;
