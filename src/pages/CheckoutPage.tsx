
import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
import { CreditCard, Smartphone, Plus, Minus, Trash2, Users } from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';
import MobileMoneyPaymentDialog from '@/components/payment/MobileMoneyPaymentDialog';

const CheckoutPage = () => {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { currentCurrency, convertPrice, formatPrice } = useCurrency();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pawapay'>('stripe');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState<{
    total: number;
    tax: number;
    final: number;
    discount: number;
  }>({
    total: 0,
    tax: 0,
    final: 0,
    discount: 0
  });
  
  const totalAmountUSD = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const TAX_RATE = 0.1; // 10% tax
  const taxAmountUSD = totalAmountUSD * TAX_RATE;
  const finalAmountUSD = totalAmountUSD + taxAmountUSD - discount;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  // Convert amounts to current currency
  useEffect(() => {
    const convertAmounts = async () => {
      try {
        const [convertedTotal, convertedTax, convertedDiscount] = await Promise.all([
          convertPrice(totalAmountUSD, 'USD'),
          convertPrice(taxAmountUSD, 'USD'),
          convertPrice(discount, 'USD')
        ]);
        
        const convertedFinal = convertedTotal + convertedTax - convertedDiscount;
        
        setConvertedAmounts({
          total: convertedTotal,
          tax: convertedTax,
          final: convertedFinal,
          discount: convertedDiscount
        });
      } catch (error) {
        console.error('Error converting amounts:', error);
        setConvertedAmounts({
          total: totalAmountUSD,
          tax: taxAmountUSD,
          final: finalAmountUSD,
          discount: discount
        });
      }
    };

    convertAmounts();
  }, [totalAmountUSD, taxAmountUSD, finalAmountUSD, discount, convertPrice, currentCurrency]);

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

      if (totalAmountUSD < data.min_order_amount) {
        toast.error(`Minimum order amount for this promo code is $${data.min_order_amount}`);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        discountAmount = totalAmountUSD * (data.discount_value / 100);
      } else {
        discountAmount = data.discount_value;
      }

      setDiscount(Math.min(discountAmount, totalAmountUSD));
      toast.success('Promo code applied successfully!');
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error('Failed to apply promo code');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: '/checkout' } });
      return;
    }

    setLoading(true);
    try {
      if (paymentMethod === 'stripe') {
        // For cart-based checkout, pass the items from cart
        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
          body: {
            payment_method: 'stripe',
            success_url: `${window.location.origin}/checkout/success`,
            cancel_url: `${window.location.origin}/checkout`,
            // Pass cart items for processing
            items: items.map(item => ({
              item_id: item.itemId,
              item_type: item.itemType,
              item_name: item.itemName,
              quantity: item.quantity,
              price: item.price
            }))
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        setShowMobileMoneyDialog(true);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initialize payment');
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
                      <div key={item.itemId} className="flex flex-col p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.itemName}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {item.itemType === 'course' ? 'Course' : 'Event Ticket'}
                              </Badge>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="text-lg font-semibold">
                                <PriceDisplay 
                                  amount={item.price} 
                                  originalCurrency="USD"
                                />
                              </div>
                              {currentCurrency !== 'USD' && (
                                <div className="text-sm text-gray-500">
                                  Original: ${item.price.toFixed(2)} USD
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {item.itemType === 'event_ticket' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.itemId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                    <RadioGroup 
                      value={paymentMethod} 
                      onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'pawapay')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit/Debit Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pawapay" id="pawapay" />
                        <Label htmlFor="pawapay" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Mobile Money
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Order Total */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Total</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <PriceDisplay amount={convertedAmounts.total} originalCurrency={currentCurrency as any} />
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-<PriceDisplay amount={convertedAmounts.discount} originalCurrency={currentCurrency as any} /></span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax (10%)</span>
                      <PriceDisplay amount={convertedAmounts.tax} originalCurrency={currentCurrency as any} />
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <PriceDisplay amount={convertedAmounts.final} originalCurrency={currentCurrency as any} />
                    </div>
                    {currentCurrency !== 'USD' && (
                      <div className="text-sm text-gray-500 text-right">
                        Original: ${finalAmountUSD.toFixed(2)} USD
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleCheckout}
                  disabled={loading || finalAmountUSD <= 0}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white py-3"
                  size="lg"
                >
                  {loading ? "Processing..." : paymentMethod === 'stripe' ? "Pay with Card" : "Pay with Mobile Money"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileMoneyPaymentDialog
        isOpen={showMobileMoneyDialog}
        onClose={() => setShowMobileMoneyDialog(false)}
        amount={convertedAmounts.final}
        currency={currentCurrency}
        items={items.map(item => ({
          item_id: item.itemId,
          item_type: item.itemType,
          item_name: item.itemName,
          quantity: item.quantity,
          price: item.price,
          ticket_holder_names: []
        }))}
        discount={convertedAmounts.discount}
        taxAmount={convertedAmounts.tax}
        promoCode={promoCode}
      />
    </Layout>
  );
};

export default CheckoutPage;
