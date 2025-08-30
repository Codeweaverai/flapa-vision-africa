
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  itemId: string;
  itemType: 'course' | 'event';
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  itemId,
  itemType,
  className,
  variant = 'ghost',
  size = 'sm',
  children
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
      variant={variant}
      size={size}
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
      {children}
    </Button>
  );
};

export default WishlistButton;
