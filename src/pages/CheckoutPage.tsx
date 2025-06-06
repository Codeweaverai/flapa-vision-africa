
import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { CreditCard, Smartphone, Plus, Minus, Trash2 } from 'lucide-react';

const CheckoutPage = () => {
  const { items, getTotalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const totalAmount = getTotalPrice();
  const TAX_RATE = 0.1; // 10% tax
  const taxAmount = totalAmount * TAX_RATE;
  const finalAmount = totalAmount + taxAmount - discount;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast.error('Invalid promo code');
        return;
      }

      // Check if promo code is valid
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;

      if (now < validFrom || (validUntil && now > validUntil)) {
        toast.error('Promo code has expired');
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error('Promo code usage limit reached');
        return;
      }

      if (totalAmount < data.min_order_amount) {
        toast.error(`Minimum order amount for this promo code is $${data.min_order_amount}`);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        discountAmount = totalAmount * (data.discount_value / 100);
      } else {
        discountAmount = data.discount_value;
      }

      setDiscount(Math.min(discountAmount, totalAmount));
      toast.success('Promo code applied successfully!');
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Failed to apply promo code');
    }
  };

  const handleStripeCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          items: items.map(item => ({
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          total_amount: finalAmount,
          tax_amount: taxAmount,
          discount_amount: discount,
          promo_code: promoCode || null,
          currency: 'USD',
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/checkout`,
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to initialize payment');
    }
  };

  const handleMobileMoneyPayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('initiate-mobile-money-payment', {
        body: {
          phone_number: phoneNumber,
          amount: finalAmount,
          currency: 'USD',
          items: items.map(item => ({
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: item.title,
            quantity: item.quantity,
            price: item.price,
          })),
          tax_amount: taxAmount,
          discount_amount: discount,
          promo_code: promoCode || null,
        }
      });

      if (error) throw error;

      toast.success('Payment initiated! Please complete the payment on your phone.');
      // You can redirect to a payment status page or poll for payment status
    } catch (error) {
      console.error('Error initiating mobile money payment:', error);
      toast.error('Failed to initiate mobile money payment');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: '/checkout' } });
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'card') {
        await handleStripeCheckout();
      } else {
        await handleMobileMoneyPayment();
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Checkout</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary">
                              {item.item_type === 'course' ? 'Course' : 'Event Ticket'}
                            </Badge>
                          </div>
                          <p className="text-lg font-semibold mt-2">${item.price.toFixed(2)}</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {item.item_type === 'event_ticket' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Details */}
              <div className="space-y-6">
                {/* Promo Code */}
                <Card>
                  <CardHeader>
                    <CardTitle>Promo Code</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <Button onClick={applyPromoCode} variant="outline">
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={(value: 'card' | 'mobile_money') => setPaymentMethod(value)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mobile_money" id="mobile_money" />
                        <Label htmlFor="mobile_money" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile Money
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'mobile_money' && (
                      <div className="mt-4">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Total */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Total</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${finalAmount.toFixed(2)}</span>
                    </div>
                    
                    <Button 
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full mt-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    >
                      {loading ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
