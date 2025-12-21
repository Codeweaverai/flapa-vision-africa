import React, { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
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
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabaseClient';

const AuthPage = () => {
  const { user, loading, signIn, signUp, otpRequired } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    // Load from localStorage if available (for convenience)
    const savedEmail = localStorage.getItem('lastAuthEmail');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Handle post-authentication redirect
  useEffect(() => {
    if (!loading && user && !otpRequired && authSuccess) {
      console.log('User authenticated and OTP completed, redirecting...');
      const invitationToken = sessionStorage.getItem('invitation_token');
      
      if (redirectParam === 'accept-invite' && invitationToken) {
        // Redirect back to invitation acceptance with the stored token
        navigate(`/accept-invite?token=${invitationToken}`);
        return;
      }
      
      // Default redirect for authenticated users
      navigate('/account');
    }
  }, [user, loading, redirectParam, navigate, otpRequired, authSuccess]);

  // Show loading while OTP is being processed
  if (user && otpRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex justify-center items-center">
        <div className="text-center text-white">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Email Verification Required</h2>
          <p className="text-orange-100">
            Please check your email and complete the verification process.
          </p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated and no OTP required
  if (!loading && user && !otpRequired && !redirectParam) {
    return <Navigate to="/account" />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setAuthSuccess(false);
    
    // Save email for convenience
    if (email) {
      localStorage.setItem('lastAuthEmail', email);
    }
    
    try {
      console.log('AuthPage: Attempting sign in');
      await signIn(email, password);
      console.log('AuthPage: Sign in successful');
      setAuthSuccess(true);
      toast.success('Sign in successful! Please check your email for verification code.');
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
    setAuthSuccess(false);
    
    // Validate inputs
    if (!fullName || !username || !email || !password) {
      setErrorMessage('All fields are required');
      setIsSubmitting(false);
      return;
    }
    
    // Update password validation to 8 characters
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
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
    
    try {
      console.log('AuthPage: Attempting sign up');
      await signUp(email, password, { full_name: fullName, username });
      console.log('AuthPage: Sign up successful');
      setAuthSuccess(true);
      toast.success('Account created! Please check your email for verification code.');
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
    setAuthSuccess(false);
    
    try {
      // Determine the final destination after Google OAuth
      const finalRedirectUrl = redirectParam === 'accept-invite' 
        ? `${window.location.origin}/accept-invite`
        : `${window.location.origin}/account`;

      console.log('Initiating Google OAuth with redirect to:', finalRedirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: finalRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      
      // Note: User will be redirected away from the page for OAuth flow
      // No need to set isSubmitting(false) here as the page will redirect
      console.log('Google OAuth initiated successfully');
      
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setErrorMessage(error.message || 'Failed to sign in with Google. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setAuthSuccess(false);
    
    try {
      // Determine the final destination after LinkedIn OAuth
      const finalRedirectUrl = redirectParam === 'accept-invite' 
        ? `${window.location.origin}/accept-invite`
        : `${window.location.origin}/account`;

      console.log('Initiating LinkedIn OAuth with redirect to:', finalRedirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: finalRedirectUrl,
          // LinkedIn OIDC specific options if needed
          queryParams: {
            // Add any specific LinkedIn parameters if required
          }
        }
      });
      
      if (error) {
        console.error('LinkedIn OAuth error:', error);
        throw error;
      }
      
      // Note: User will be redirected away from the page for OAuth flow
      // No need to set isSubmitting(false) here as the page will redirect
      console.log('LinkedIn OAuth initiated successfully');
      
    } catch (error: any) {
      console.error('LinkedIn sign in error:', error);
      setErrorMessage(error.message || 'Failed to sign in with LinkedIn. Please try again.');
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const isInvitationFlow = redirectParam === 'accept-invite';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-purple-500 to-pink-500 flex">
      {/* Left Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block mb-4 hover:opacity-90 transition-opacity">
              <div className="relative">
                <img 
                  src="/lovable-uploads/splash-icon.png.png" 
                  alt="SkillPulse Logo"
                  className="h-20 mx-auto mb-4 drop-shadow-lg"
                />
                <div className="pulse-animation"></div>
              </div>
              <h1 className="text-5xl font-bold mb-2 text-white drop-shadow-lg bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                SkillPulse
              </h1>
              <p className="text-orange-100 text-lg font-light">
                Built for the Skill-Driven Generation
              </p>
            </Link>
          </div>
          
          <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl rounded-2xl">
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
                className="w-full bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg rounded-xl h-12 font-medium mb-4 transition-all duration-200 hover:shadow-xl disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isSubmitting ? 'Connecting to Google...' : 'Continue with Google'}
              </Button>

              {/* LinkedIn Sign In Button */}
              <Button 
                onClick={handleLinkedInSignIn}
                disabled={isSubmitting}
                variant="outline"
                className="w-full bg-[#0077B5]/90 hover:bg-[#0077B5] text-white border-0 shadow-lg rounded-xl h-12 font-medium mb-6 transition-all duration-200 hover:shadow-xl disabled:opacity-50 hover:bg-[#0077B5]/100"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                )}
                {isSubmitting ? 'Connecting to LinkedIn...' : 'Continue with LinkedIn'}
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

              {/* Rest of your existing code remains the same */}
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm border-0 rounded-xl mb-6">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300"
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
                          className="pl-10 bg-white/20 border-orange-200/30 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          minLength={8}
                          className="pl-10 pr-10 bg-white/20 border-orange-200/30 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300 transition-all duration-300"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-orange-200" />
                          ) : (
                            <Eye className="h-4 w-4 text-orange-200" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-0 rounded-xl h-12 font-medium shadow-lg text-white transition-all duration-300 hover:shadow-xl" 
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
                    <div className="text-center">
                      <Link
                        to="/forgot-password"
                        className="text-sm text-orange-100 hover:text-white underline transition-colors duration-300"
                      >
                        Forgot your password?
                      </Link>
                    </div>
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
                          className="pl-10 bg-white/20 border-orange-200/30 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300 transition-all duration-300"
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
                          className="pl-10 bg-white/20 border-orange-200/30 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300 transition-all duration-300"
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
                          className="pl-10 bg-white/20 border-orange-200/30 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300 transition-all duration-300"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordRegister" className="text-white font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200 h-5 w-5" />
                        <Input 
                          id="passwordRegister" 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                          minLength={8}
                          className="pl-10 pr-10 bg-white/20 border-orange-200/30 text-white placeholder:text-orange-100 rounded-xl h-12 backdrop-blur-sm focus:bg-white/30 focus:border-orange-300 transition-all duration-300"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-orange-200" />
                          ) : (
                            <Eye className="h-4 w-4 text-orange-200" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-orange-100">Password must be at least 8 characters</p>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 border-0 rounded-xl h-12 font-medium shadow-lg text-white transition-all duration-300 hover:shadow-xl" 
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

              <div className="mt-6 text-center">
                <p className="text-sm text-orange-100">
                  🔒 For security, email verification is required for every login
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Enhanced Image with Animations */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/40 via-purple-600/40 to-pink-500/40 z-10"></div>
        <img 
          src="/lovable-uploads/42295.jpg"
          alt="SkillPulse Community"
          className="w-full h-full object-cover transform scale-105 transition-transform duration-10000 ease-in-out hover:scale-110"
        />
        
        {/* Animated Text Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-8">
          <div className="typing-container text-center w-full max-w-4xl">
            <h2 className="text-6xl font-black text-white mb-6 drop-shadow-2xl tracking-tight bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
              SkillPulse
            </h2>
            <div className="typing-animation-wrapper">
              <p className="text-2xl text-orange-100 font-light mb-4 drop-shadow-lg typing-text-first">
                Built for the Skill-Driven Generation
              </p>
              <p className="text-3xl font-bold text-white drop-shadow-2xl bg-gradient-to-r from-white via-orange-200 to-purple-200 bg-clip-text text-transparent typing-text-second">
                Building Africa's Skills Ecosystem
              </p>
            </div>
          </div>

          {/* Floating elements */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full opacity-60 animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-orange-300 rounded-full opacity-40 animate-float-delayed"></div>
          <div className="absolute bottom-1/4 left-1/3 w-5 h-5 bg-purple-300 rounded-full opacity-50 animate-float-slow"></div>
          <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-pink-300 rounded-full opacity-70 animate-float"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(-10px) scale(1); }
          50% { transform: translateY(10px) scale(1.1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(5px) scale(1); }
          50% { transform: translateY(-15px) scale(0.95); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
        
        /* Typing Animation */
        .typing-text-first {
          overflow: hidden;
          border-right: 2px solid rgba(255, 255, 255, 0.7);
          white-space: nowrap;
          margin: 0 auto;
          animation: 
            typing-first 3s steps(40, end),
            blink-caret 0.75s step-end infinite;
          animation-fill-mode: both;
        }
        
        .typing-text-second {
          overflow: hidden;
          border-right: 2px solid rgba(255, 255, 255, 0.7);
          white-space: nowrap;
          margin: 0 auto;
          animation: 
            typing-second 3s steps(40, end) 3s,
            blink-caret 0.75s step-end infinite;
          animation-fill-mode: both;
          opacity: 0;
        }
        
        @keyframes typing-first {
          from { width: 0; opacity: 1; }
          to { width: 100%; opacity: 1; }
        }
        
        @keyframes typing-second {
          from { width: 0; opacity: 1; }
          to { width: 100%; opacity: 1; }
        }
        
        @keyframes blink-caret {
          from, to { border-color: transparent; }
          50% { border-color: rgba(255, 255, 255, 0.7); }
        }
        
        .pulse-animation {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0;
          }
        }
        
        .typing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .typing-animation-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
      ` }} />
    </div>
  );
};

export default AuthPage;
