
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const AdminAuthPage = () => {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load from localStorage if available (for convenience)
    const savedEmail = localStorage.getItem('lastAdminAuthEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Check if already authenticated and admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.rpc('is_admin');
          
          if (error) {
            console.error('Error checking admin status:', error);
          } else if (data) {
            // User is admin, redirect to admin dashboard
            navigate('/admin');
          } else {
            // User is logged in but not an admin
            toast.error("You don't have admin permissions");
            setErrorMessage("Your account doesn't have administrator privileges");
          }
        } catch (error) {
          console.error('Unexpected error:', error);
        }
      }
    };

    if (!loading && user) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    // Save email for convenience
    if (email) {
      localStorage.setItem('lastAdminAuthEmail', email);
    }
    
    try {
      await signIn(email, password);
      // Admin status check is handled in the useEffect
    } catch (error: any) {
      console.error('Admin sign in error:', error);
      setErrorMessage(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <div className="container max-w-md mx-auto py-20">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-gradient inline-block mb-4">Mbolela Pule</Link>
          <h1 className="text-3xl font-bold mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Sign in to access the administration panel</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Administrator Access</CardTitle>
            <CardDescription>Enter your admin credentials to access the dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="pt-2">
                <Link to="/auth" className="text-sm text-blue-600 hover:underline">
                  Regular user login
                </Link>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In as Administrator'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AdminAuthPage;
