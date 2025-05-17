
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    if (!name) return 'MP';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-gradient">
              Mbolela Pule
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/ventures" className="text-foreground hover:text-primary transition-colors">
              Ventures
            </Link>
            <Link to="/speaking" className="text-foreground hover:text-primary transition-colors">
              Speaking & Media
            </Link>
            <Link to="/ai-animations" className="text-foreground hover:text-primary transition-colors">
              AI Animations
            </Link>
            <Link to="/learning" className="text-foreground hover:text-primary transition-colors">
              Learning
            </Link>
            <Link to="/events" className="text-foreground hover:text-primary transition-colors">
              Events
            </Link>
          </nav>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || ''} />
                      <AvatarFallback>{getInitials(user.user_metadata.full_name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.user_metadata.full_name && (
                        <p className="font-medium">{user.user_metadata.full_name}</p>
                      )}
                      {user.email && (
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Account</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/consult" className="w-full cursor-pointer">
                      Book a Consultation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild variant="default">
                  <Link to="/consult">Book a Consultation</Link>
                </Button>
              </>
            )}
          </div>
          
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background border-b animate-fade-in">
          <div className="px-4 pt-2 pb-4 space-y-4">
            <Link 
              to="/" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/ventures" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Ventures
            </Link>
            <Link 
              to="/speaking" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Speaking & Media
            </Link>
            <Link 
              to="/ai-animations" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              AI Animations
            </Link>
            <Link 
              to="/learning" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Learning
            </Link>
            <Link 
              to="/events" 
              className="block text-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            
            {user ? (
              <>
                <div className="flex items-center space-x-2 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || ''} />
                    <AvatarFallback>{getInitials(user.user_metadata.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user.user_metadata.full_name || user.email}</span>
                </div>
                <Link 
                  to="/account" 
                  className="block text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="inline-block mr-2 h-4 w-4" />
                  My Account
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full" onClick={() => setIsMenuOpen(false)}>
                  <Link to="/auth">Sign in</Link>
                </Button>
              </>
            )}
            
            <Button asChild className="w-full" variant="default" onClick={() => setIsMenuOpen(false)}>
              <Link to="/consult">Book a Consultation</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
