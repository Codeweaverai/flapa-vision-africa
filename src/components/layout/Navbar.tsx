import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useShoppingCart } from '@/contexts/CartContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ShoppingCart, User, Menu, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import CartSidebar from '../cart/CartSidebar';
import { useMediaQuery } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '../ThemeToggle';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { cart } = useShoppingCart();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const { wishlistItems } = useWishlist();

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white border-b shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="shrink-0 flex items-center">
              <Link to="/">
                <img
                  className="h-8 w-auto"
                  src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
                  alt="Your Company"
                />
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link to="/" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link to="/community/courses" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Courses
              </Link>
              <Link to="/events" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Events
              </Link>
              <Link to="/speaking" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Speaking
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {user && (
              <Link
                to="/wishlist"
                className="relative text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                <span>Wishlist</span>
                {wishlistItems.length > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {wishlistItems.length}
                  </Badge>
                )}
              </Link>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5 text-gray-700 hover:text-primary" />
                  {cart.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {cart.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] bg-white">
                <SheetHeader>
                  <SheetTitle>Shopping Cart</SheetTitle>
                  <SheetDescription>
                    Review and manage items in your cart.
                  </SheetDescription>
                </SheetHeader>
                <CartSidebar />
              </SheetContent>
            </Sheet>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url as string} />
                      <AvatarFallback>{user?.email?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/inbox')}>
                    <Inbox className="mr-2 h-4 w-4" />
                    <span>Inbox</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Login
              </Link>
            )}
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/community/courses"
              className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Courses
            </Link>
            <Link
              to="/events"
              className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link
              to="/speaking"
              className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Speaking
            </Link>
            
            {user && (
              <Link
                to="/wishlist"
                className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Heart className="h-4 w-4" />
                <span>Wishlist</span>
                {wishlistItems.length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {wishlistItems.length}
                  </Badge>
                )}
              </Link>
            )}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="relative w-full justify-start py-2 px-3 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-50 flex items-center" onClick={() => setIsOpen(false)}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart
                  {cart.length > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {cart.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:w-[400px] bg-white">
                <SheetHeader>
                  <SheetTitle>Shopping Cart</SheetTitle>
                  <SheetDescription>
                    Review and manage items in your cart.
                  </SheetDescription>
                </SheetHeader>
                <CartSidebar />
              </SheetContent>
            </Sheet>

            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link
                  to="/inbox"
                  className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
