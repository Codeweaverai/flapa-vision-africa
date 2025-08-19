
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Gift, Calendar, MapPin, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface GiftDetails {
  id: string;
  gift_code: string;
  item_type: 'course' | 'event';
  item_id: string;
  sender_name: string;
  recipient_name: string;
  personal_message?: string;
  status: string;
  expires_at: string;
  item_details?: any;
}

const GiftRedeemPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [giftCode, setGiftCode] = useState(searchParams.get('code') || '');
  const [gift, setGift] = useState<GiftDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (giftCode && user) {
      validateGiftCode();
    }
  }, [giftCode, user]);

  const validateGiftCode = async () => {
    if (!giftCode.trim()) {
      toast.error('Please enter a gift code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-gift', {
        body: { giftCode, action: 'validate' }
      });

      if (error) throw error;

      if (data.success) {
        setGift(data.gift);
      } else {
        toast.error(data.message || 'Invalid gift code');
        setGift(null);
      }
    } catch (error) {
      console.error('Error validating gift code:', error);
      toast.error('Failed to validate gift code');
      setGift(null);
    } finally {
      setLoading(false);
    }
  };

  const claimGift = async () => {
    if (!gift || !user) return;

    setClaiming(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-gift', {
        body: { giftCode: gift.gift_code, action: 'claim' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Gift claimed successfully!');
        if (gift.item_type === 'course') {
          navigate(`/learning/course/${gift.item_id}`);
        } else {
          navigate('/account/orders');
        }
      } else {
        toast.error(data.message || 'Failed to claim gift');
      }
    } catch (error) {
      console.error('Error claiming gift:', error);
      toast.error('Failed to claim gift');
    } finally {
      setClaiming(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <Gift className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-4">
                Please sign in to your account to redeem your gift.
              </p>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                  <Gift className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Redeem Your Gift</h1>
              <p className="text-gray-600">
                Enter your gift code below to claim your course or event ticket.
              </p>
            </div>

            {/* Gift Code Input */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enter Gift Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="giftCode">Gift Code</Label>
                  <Input
                    id="giftCode"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                    placeholder="Enter your gift code (e.g., GIFT-ABC12345)"
                  />
                </div>
                <Button 
                  onClick={validateGiftCode}
                  disabled={loading || !giftCode.trim()}
                  className="w-full"
                >
                  {loading ? 'Validating...' : 'Validate Gift Code'}
                </Button>
              </CardContent>
            </Card>

            {/* Gift Details */}
            {gift && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {gift.item_type === 'course' ? (
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Calendar className="h-5 w-5 text-orange-600" />
                    )}
                    Gift Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={gift.status === 'pending' ? 'bg-green-500' : 'bg-gray-500'}>
                      {gift.status === 'pending' ? 'Ready to Claim' : gift.status}
                    </Badge>
                  </div>

                  {/* From */}
                  <div className="flex items-center justify-between">
                    <span className="font-medium">From:</span>
                    <span>{gift.sender_name}</span>
                  </div>

                  {/* Item Details */}
                  {gift.item_details && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <h4 className="font-semibold mb-2">{gift.item_details.title}</h4>
                      
                      {gift.item_type === 'event' && (
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(gift.item_details.start_time), 'PPP p')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{gift.item_details.location}</span>
                          </div>
                        </div>
                      )}
                      
                      {gift.item_type === 'course' && (
                        <p className="text-sm text-gray-600">{gift.item_details.description}</p>
                      )}
                    </div>
                  )}

                  {/* Personal Message */}
                  {gift.personal_message && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Personal Message:</p>
                      <p className="text-sm text-gray-600 italic">"{gift.personal_message}"</p>
                    </div>
                  )}

                  {/* Expiry */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Expires on {format(new Date(gift.expires_at), 'PPP')}</span>
                  </div>

                  {/* Claim Button */}
                  {gift.status === 'pending' && (
                    <Button 
                      onClick={claimGift}
                      disabled={claiming}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      {claiming ? 'Claiming...' : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Claim Your Gift
                        </>
                      )}
                    </Button>
                  )}

                  {gift.status === 'claimed' && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-medium">Gift Already Claimed</p>
                      <p className="text-sm text-green-600">This gift has been successfully redeemed.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GiftRedeemPage;
