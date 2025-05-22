
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import CreatorLayout from '@/components/creator/CreatorLayout';
import ProfilePictureUpload from '@/components/user/ProfilePictureUpload';
import StripeAccountManagement from '@/components/creator/StripeAccountManagement';

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  bio: z.string().optional(),
  mobile_money_number: z.string().optional(),
  payout_method: z.enum(["stripe", "mobile_money", "bank"]),
  is_creator: z.boolean().default(true),
});

const CreatorSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch_code: '',
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      username: "",
      bio: "",
      mobile_money_number: "",
      payout_method: "stripe",
      is_creator: true,
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          toast.error("Error fetching profile data");
          console.error("Error fetching profile:", error);
          return;
        }
        
        if (data) {
          form.reset({
            full_name: data.full_name || "",
            username: data.username || "",
            bio: data.bio || "",
            mobile_money_number: data.mobile_money_number || "",
            payout_method: (data.payout_method as "stripe" | "mobile_money" | "bank") || "stripe",
            is_creator: data.is_creator || true,
          });
          
          setAvatarUrl(data.avatar_url || null);
          
          if (data.bank_account_details) {
            setBankDetails({
              account_name: data.bank_account_details.account_name || '',
              account_number: data.bank_account_details.account_number || '',
              bank_name: data.bank_account_details.bank_name || '',
              branch_code: data.bank_account_details.branch_code || '',
            });
          }
        }
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        toast.error("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Prepare the data to update
      const updates = {
        ...values,
        updated_at: new Date().toISOString(),
        bank_account_details: form.watch('payout_method') === 'bank' ? bankDetails : null,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) {
        toast.error("Failed to update profile");
        console.error("Error updating profile:", error);
        return;
      }
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in onSubmit:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
  };

  const handleBankDetailChange = (field: keyof typeof bankDetails, value: string) => {
    setBankDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <CreatorLayout>
      <div className="section-container">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Update your creator profile information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3">
                        <ProfilePictureUpload 
                          userId={user?.id} 
                          existingUrl={avatarUrl} 
                          onUploadComplete={handleAvatarUpload} 
                        />
                      </div>
                      
                      <div className="space-y-4 md:w-2/3">
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="Your username" {...field} />
                              </FormControl>
                              <FormDescription>
                                This will be used for your creator profile URL
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell students about yourself" 
                                  {...field} 
                                  rows={5} 
                                />
                              </FormControl>
                              <FormDescription>
                                Briefly introduce yourself and your expertise
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="is_creator"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between">
                              <div className="space-y-0">
                                <FormLabel>Creator Mode</FormLabel>
                                <FormDescription>
                                  Enable creator features for your account
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Configure how you receive payments from your courses and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="payout_method"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Payout Method</FormLabel>
                            <FormControl>
                              <div className="flex flex-col space-y-2">
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    value="stripe"
                                    checked={field.value === "stripe"}
                                    onChange={() => field.onChange("stripe")}
                                    className="radio"
                                  />
                                  <span>Stripe (International)</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    value="mobile_money"
                                    checked={field.value === "mobile_money"}
                                    onChange={() => field.onChange("mobile_money")}
                                    className="radio"
                                  />
                                  <span>Mobile Money</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    value="bank"
                                    checked={field.value === "bank"}
                                    onChange={() => field.onChange("bank")}
                                    className="radio"
                                  />
                                  <span>Bank Transfer</span>
                                </label>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {form.watch('payout_method') === 'mobile_money' && (
                        <FormField
                          control={form.control}
                          name="mobile_money_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Money Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your mobile money number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      
                      {form.watch('payout_method') === 'bank' && (
                        <div className="space-y-4">
                          <FormItem>
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter bank name" 
                                value={bankDetails.bank_name} 
                                onChange={(e) => handleBankDetailChange('bank_name', e.target.value)} 
                              />
                            </FormControl>
                          </FormItem>
                          
                          <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter account name" 
                                value={bankDetails.account_name} 
                                onChange={(e) => handleBankDetailChange('account_name', e.target.value)} 
                              />
                            </FormControl>
                          </FormItem>
                          
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter account number" 
                                value={bankDetails.account_number} 
                                onChange={(e) => handleBankDetailChange('account_number', e.target.value)} 
                              />
                            </FormControl>
                          </FormItem>
                          
                          <FormItem>
                            <FormLabel>Branch Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter branch code" 
                                value={bankDetails.branch_code} 
                                onChange={(e) => handleBankDetailChange('branch_code', e.target.value)} 
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                      )}
                      
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Payment Settings"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {form.watch('payout_method') === 'stripe' && (
                <StripeAccountManagement />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account security and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Email</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {user?.email}
                  </p>
                  <Button variant="outline">Change Email</Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Password</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Change your password regularly to keep your account secure
                  </p>
                  <Button variant="outline">Change Password</Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Delete Account</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Permanently delete your account and all your data
                  </p>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CreatorLayout>
  );
};

export default CreatorSettings;
