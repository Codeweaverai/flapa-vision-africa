import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WishlistButtonProps {
  itemId: string;
  itemType: 'course' | 'event';
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  showText?: boolean;
  iconOnly?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  itemId,
  itemType,
  className,
  variant = 'ghost',
  size = 'sm',
  children,
  showText = false,
  iconOnly = false
}) => {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inWishlist = isInWishlist(itemId, itemType);
  const isDisabled = isLoading || isProcessing;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDisabled) return;
    
    setIsProcessing(true);
    try {
      await toggleWishlist(itemId, itemType);
      // Success message is handled in the hook
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (iconOnly) return null;
    
    if (showText) {
      return inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
    }
    
    return children;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isDisabled}
      className={cn(
        "transition-all duration-200 ease-in-out",
        inWishlist 
          ? "text-red-500 hover:text-red-600 hover:bg-red-50" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        isDisabled && "opacity-50 cursor-not-allowed",
        iconOnly && "p-2",
        className
      )}
      aria-label={inWishlist ? `Remove ${itemType} from wishlist` : `Add ${itemType} to wishlist`}
    >
      <Heart 
        className={cn(
          "h-4 w-4 transition-all duration-200",
          inWishlist && "fill-current",
          isProcessing && "animate-pulse"
        )} 
      />
      {getButtonText() && (
        <span className={iconOnly ? "sr-only" : "ml-2"}>
          {getButtonText()}
        </span>
      )}
    </Button>
  );
};

export default WishlistButton;
