
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  itemId: string;
  itemType: 'course' | 'event';
  className?: string;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  itemId,
  itemType,
  className
}) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(itemId, itemType);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      removeFromWishlist(itemId, itemType);
    } else {
      addToWishlist(itemId, itemType);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn(
        "p-2 hover:bg-gray-100 transition-colors",
        inWishlist && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          inWishlist && "fill-current"
        )} 
      />
    </Button>
  );
};

export default WishlistButton;
