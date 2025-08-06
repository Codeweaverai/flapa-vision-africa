import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address.');
      setSending(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // Ensure this route exists
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent! Please check your inbox.');
      setEmail('');
    }

    setSending(false);
  };

  return (
    <Layout>
      <div
        className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center px-4 py-8"
        aria-busy={sending}
      >
        <Card className="w-full max-w-md bg-white shadow-md">
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  aria-required="true"
                  aria-describedby="emailHelp"
                  disabled={sending}
                />
                <p id="emailHelp" className="mt-1 text-sm text-gray-500">
                  We’ll send you a link to reset your password.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white"
                disabled={sending}
                aria-live="polite"
              >
                {sending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;

