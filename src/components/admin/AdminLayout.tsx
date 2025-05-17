
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  CalendarDays, 
  MessageSquare,
  LogOut,
  Menu,
  Users,
  UserCheck
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout = ({ children, title = "Dashboard" }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [open, setOpen] = useState(false);

  // Check if user is not admin and redirect
  useEffect(() => {
    // This check is for extra safety, but should be handled by AdminRoute already
    if (!user) {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin-login');
      toast.success('Successfully signed out');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Events", href: "/admin/events", icon: <CalendarDays className="h-5 w-5" /> },
    { name: "Registrations", href: "/admin/registrations", icon: <UserCheck className="h-5 w-5" /> },
    { name: "Consultation Bookings", href: "/admin/bookings", icon: <MessageSquare className="h-5 w-5" /> },
    { name: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  ];

  const NavLink = ({ item }: { item: { name: string; href: string; icon: JSX.Element } }) => (
    <Link
      to={item.href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 ${
        location.pathname === item.href ||
        (item.href !== '/admin' && location.pathname.startsWith(item.href))
          ? 'bg-slate-100 font-medium'
          : ''
      }`}
      onClick={() => setOpen(false)}
    >
      {item.icon}
      {item.name}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-30">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            {isMobile && (
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                  <div className="py-6">
                    <h2 className="text-lg font-semibold mb-4 px-2">Admin Menu</h2>
                    <nav className="space-y-1">
                      {navItems.map((item) => (
                        <NavLink key={item.name} item={item} />
                      ))}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Link to="/admin" className="font-bold text-lg">
              Admin Panel
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm hover:underline hidden md:block">
              Visit Website
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - only shown on desktop */}
        {!isMobile && (
          <aside className="w-[240px] border-r bg-white shrink-0 h-[calc(100vh-64px)] sticky top-16">
            <nav className="py-6 px-3 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-6">{title}</h1>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
