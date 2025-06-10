
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
  const { items, getTotalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { currentCurrency, convertPrice, formatPrice } = useCurrency();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money'>('card');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [convertedTotalAmount, setConvertedTotalAmount] = useState(0);
  const [convertedTaxAmount, setConvertedTaxAmount] = useState(0);
  const [convertedDiscount, setConvertedDiscount] = useState(0);
  
  const totalAmount = getTotalPrice();
  const TAX_RATE = 0.1; // 10% tax
  const taxAmount = totalAmount * TAX_RATE;
  const finalAmount = totalAmount + taxAmount - discount;

  // Convert amounts to current currency
  useEffect(() => {
    const convertAmounts = async () => {
      try {
        const [convertedTotal, convertedTax, convertedDiscountAmount] = await Promise.all([
          convertPrice(totalAmount, 'USD'),
          convertPrice(taxAmount, 'USD'),
          convertPrice(discount, 'USD')
        ]);
        
        setConvertedTotalAmount(convertedTotal);
        setConvertedTaxAmount(convertedTax);
        setConvertedDiscount(convertedDiscountAmount);
      } catch (error) {
        console.error('Error converting amounts:', error);
        setConvertedTotalAmount(totalAmount);
        setConvertedTaxAmount(taxAmount);
        setConvertedDiscount(discount);
      }
    };

    convertAmounts();
  }, [totalAmount, taxAmount, discount, convertPrice]);

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
            ticket_holder_names: item.ticket_holder_names || []
          })),
          total_amount: finalAmount,
          tax_amount: taxAmount,
          discount_amount: discount,
          promo_code: promoCode || null,
          currency: currentCurrency,
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
        setShowMobileMoneyDialog(true);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTicketHolderSummary = (item: any) => {
    if (item.item_type !== 'event_ticket' || !item.ticket_holder_names?.length) {
      return null;
    }

    const filledHolders = item.ticket_holder_names.filter((holder: any) => holder.name?.trim());
    
    return (
      <div className="mt-2 p-2 bg-blue-50 rounded border">
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Ticket Holders:</span>
        </div>
        {filledHolders.length > 0 ? (
          <div className="text-sm text-blue-700">
            {filledHolders.map((holder: any, index: number) => (
              <div key={index}>• {holder.name}</div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-orange-600">
            ⚠️ Please add ticket holder names before checkout
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return null;
  }

  const convertedFinalAmount = convertedTotalAmount + convertedTaxAmount - convertedDiscount;

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
                      <div key={item.id} className="flex flex-col p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">
                                {item.item_type === 'course' ? 'Course' : 'Event Ticket'}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <PriceDisplay 
                                amount={item.price} 
                                originalCurrency="USD"
                                className="text-lg font-semibold"
                              />
                            </div>
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
                        
                        {renderTicketHolderSummary(item)}
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
                          Mobile Money (PawaPay)
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
                      <span>Subtotal:</span>
                      <PriceDisplay amount={totalAmount} originalCurrency="USD" />
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <PriceDisplay amount={taxAmount} originalCurrency="USD" />
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-<PriceDisplay amount={discount} originalCurrency="USD" /></span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <PriceDisplay amount={finalAmount} originalCurrency="USD" />
                    </div>
                    
                    <Button 
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full mt-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    >
                      {loading ? 'Processing...' : (
                        <>Pay <PriceDisplay amount={finalAmount} originalCurrency="USD" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileMoneyPaymentDialog
        isOpen={showMobileMoneyDialog}
        onClose={() => setShowMobileMoneyDialog(false)}
        amount={finalAmount}
        currency={currentCurrency}
        items={items}
        discount={discount}
        taxAmount={taxAmount}
        promoCode={promoCode}
      />
    </Layout>
  );
};

export default CheckoutPage;
