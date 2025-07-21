
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { 
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';

const AuthPage = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Add error boundary for initial load
    try {
      // Load from localStorage if available (for convenience)
      const savedEmail = localStorage.getItem('lastAuthEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
      setIsPageLoading(false);
    } catch (error) {
      console.error('Error loading auth page:', error);
      setErrorMessage('Failed to load authentication page. Please refresh and try again.');
      setIsPageLoading(false);
    }
  }, []);

  // Show loading state during initial page load
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/account" />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Save email for convenience
      if (email) {
        localStorage.setItem('lastAuthEmail', email);
      }
      
      await signIn(email, password);
      // Success handling is done in AuthContext
    } catch (error: any) {
      console.error('Sign in error:', error);
      setErrorMessage(error.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      // Validate inputs
      if (!fullName || !username || !email || !password) {
        setErrorMessage('All fields are required');
        setIsSubmitting(false);
        return;
      }
      
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters');
        setIsSubmitting(false);
        return;
      }
      
      // Additional username validation
      if (username.length < 3) {
        setErrorMessage('Username must be at least 3 characters');
        setIsSubmitting(false);
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setErrorMessage('Username can only contain letters, numbers, and underscores');
        setIsSubmitting(false);
        return;
      }
      
      // Save email for convenience
      localStorage.setItem('lastAuthEmail', email);
      
      await signUp(email, password, { full_name: fullName, username });
      // Success handling is done in AuthContext
    } catch (error: any) {
      console.error('Sign up error:', error);
      setErrorMessage(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/account`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setErrorMessage(error.message || 'Failed to sign in with Google.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img 
          src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//2330.jpg"
          alt="Learning illustration"
          className="w-full h-full object-cover rounded-r-3xl shadow-2xl"
          onError={(e) => {
            console.log('Image failed to load, using fallback');
            // Fallback if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-600/20 rounded-r-3xl"></div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="text-3xl font-bold text-white inline-block mb-4 hover:text-orange-200 transition-colors">
              SkillPulse Events & Professional Skills Marketplace
            </Link>
            <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">Welcome</h1>
            <p className="text-orange-100">Sign in to your account or create a new one</p>
          </div>
          
          <Card className="backdrop-blur-md bg-white/20 border-0 shadow-2xl rounded-2xl">
            <CardContent className="p-6">
              {errorMessage && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-300 backdrop-blur-sm mb-6">
                  <AlertDescription className="text-white">{errorMessage}</AlertDescription>
                </Alert>
              )}

              {/* Google Sign In Button */}
              <Button 
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                variant="outline"
                className="w-full bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg rounded-xl h-12 font-medium mb-6"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-orange-200/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gradient-to-r from-orange-500 to-purple-600 px-3 py-1 rounded-full text-white text-sm font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm border-0 rounded-xl mb-6">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="pl-10 bg-white/20 border-orange-200/50 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="password" 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="pl-10 bg-white/20 border-orange-200/50 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300"
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-0 rounded-xl h-12 font-medium shadow-lg text-white" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-white font-medium">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="fullName" 
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="pl-10 bg-white/20 border-orange-200/50 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-white font-medium">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="username" 
                          placeholder="johndoe"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          className="pl-10 bg-white/20 border-orange-200/50 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300"
                        />
                      </div>
                      <p className="text-xs text-orange-100">
                        Username must be at least 3 characters and can only contain letters, numbers, and underscores
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailRegister" className="text-white font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="emailRegister" 
                          type="email" 
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="pl-10 bg-white/20 border-orange-200/50 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordRegister" className="text-white font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="passwordRegister" 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                          minLength={6}
                          className="pl-10 bg-white/20 border-orange-200/50 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300"
                        />
                      </div>
                      <p className="text-xs text-orange-100">Password must be at least 6 characters</p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-0 rounded-xl h-12 font-medium shadow-lg text-white" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
