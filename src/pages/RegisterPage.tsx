
import React, { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, UserPlus, Mail, Lock, User, AtSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RegisterPage = () => {
  const { user, loading, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/account" />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    
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
    
    try {
      await signUp(email, password, { full_name: fullName, username });
      toast.success('Account created successfully! Please check your email to verify your account.');
      navigate('/login');
    } catch (error: any) {
      console.error('Sign up error:', error);
      setErrorMessage(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Mbolela Pule
              </h1>
            </Link>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Your Account</h2>
            <p className="text-gray-600">Join our learning community today</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-gray-800">Register</CardTitle>
              <CardDescription>Enter your information to create your account</CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="fullName" 
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="username" 
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Username must be at least 3 characters and can only contain letters, numbers, and underscores
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailRegister" className="text-gray-700">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="emailRegister" 
                      type="email" 
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passwordRegister" className="text-gray-700">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="passwordRegister" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={6}
                      placeholder="Enter your password"
                      className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl" 
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Account
                    </>
                  )}
                </Button>
                
                <div className="text-center text-sm pt-4">
                  <span className="text-gray-600">Already have an account? </span>
                  <Link 
                    to="/login" 
                    className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
                  >
                    Sign in here
                  </Link>
                </div>
              </CardContent>
            </form>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-purple-600 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
