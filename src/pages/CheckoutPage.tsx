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
import { CreditCard, Smartphone, Plus, Minus, Trash2, Gift, CheckCircle, User, Mail, MessageSquare } from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';
import MobileMoneyPaymentDialog from '@/components/payment/MobileMoneyPaymentDialog';

// Gift card validation function
const validateGiftCard = async (giftCardCode: string, orderAmount: number) => {
  try {
    const { data, error } = await supabase.functions.invoke('validate-gift-card', {
      body: {
        giftCardCode,
        orderAmount
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Gift card validation error:', error);
    throw error;
  }
};

const CheckoutPage = () => {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { currentCurrency, convertPrice } = useCurrency();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pawapay' | 'free'>('stripe');
  const [promoCode, setPromoCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [convertedAmounts, setConvertedAmounts] = useState<{
    total: number;
    tax: number;
    final: number;
    discount: number;
    giftCardDiscount: number;
  }>({
    total: 0,
    tax: 0,
    final: 0,
    discount: 0,
    giftCardDiscount: 0
  });
  
  const totalAmountUSD = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const TAX_RATE = 0.04;
  const taxAmountUSD = totalAmountUSD * TAX_RATE;
  const finalAmountBeforeDiscountsUSD = totalAmountUSD + taxAmountUSD;
  const finalAmountUSD = finalAmountBeforeDiscountsUSD - discount - giftCardDiscount;

  // Automatically set payment method to 'free' when amount is 0
  useEffect(() => {
    if (finalAmountUSD <= 0) {
      setPaymentMethod('free');
    } else if (paymentMethod === 'free') {
      setPaymentMethod('stripe');
    }
  }, [finalAmountUSD, paymentMethod]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  // Convert amounts to current currency
  useEffect(() => {
    const convertAmounts = async () => {
      try {
        const [convertedTotal, convertedTax, convertedDiscount, convertedGiftCardDiscount] = await Promise.all([
          convertPrice(totalAmountUSD, 'USD'),
          convertPrice(taxAmountUSD, 'USD'),
          convertPrice(discount, 'USD'),
          convertPrice(giftCardDiscount, 'USD')
        ]);
        
        const convertedFinal = convertedTotal + convertedTax - convertedDiscount - convertedGiftCardDiscount;
        
        setConvertedAmounts({
          total: convertedTotal,
          tax: convertedTax,
          final: convertedFinal,
          discount: convertedDiscount,
          giftCardDiscount: convertedGiftCardDiscount
        });
      } catch (error) {
        console.error('Error converting amounts:', error);
        setConvertedAmounts({
          total: totalAmountUSD,
          tax: taxAmountUSD,
          final: finalAmountUSD,
          discount: discount,
          giftCardDiscount: giftCardDiscount
        });
      }
    };

    convertAmounts();
  }, [totalAmountUSD, taxAmountUSD, finalAmountUSD, discount, giftCardDiscount, convertPrice, currentCurrency]);

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

  // Gift card validation function
  const applyGiftCard = async () => {
    if (!giftCardCode.trim()) return;

    try {
      setGiftCardLoading(true);
      const result = await validateGiftCard(giftCardCode, finalAmountBeforeDiscountsUSD);

      if (result.success) {
        setGiftCardDiscount(result.discount_amount);
        setAppliedGiftCard(result.giftCard);
        toast.success(`Gift card applied! Discount: $${result.discount_amount.toFixed(2)}`);
      } else {
        toast.error(result.message || 'Invalid gift card');
      }
    } catch (error) {
      console.error('Error applying gift card:', error);
      toast.error('Failed to apply gift card');
    } finally {
      setGiftCardLoading(false);
    }
  };

  const removeGiftCard = () => {
    setGiftCardDiscount(0);
    setAppliedGiftCard(null);
    setGiftCardCode('');
    toast.info('Gift card removed');
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: '/checkout' } });
      return;
    }

    setLoading(true);
    try {
      // Prepare common checkout data with metadata
      const checkoutData: any = {
        items: items.map(item => ({
          item_id: item.itemId,
          item_type: item.itemType,
          item_name: item.itemName,
          quantity: item.quantity,
          price: item.price,
          // Add metadata for gift items
          metadata: item.giftMetadata ? {
            sender_name: item.giftMetadata.senderName,
            recipient_name: item.giftMetadata.recipientName,
            recipient_email: item.giftMetadata.recipientEmail,
            personal_message: item.giftMetadata.personalMessage,
            amount: item.giftMetadata.amount,
            // For gift events/courses, include the original item details
            ...(item.itemType === 'gift_course' || item.itemType === 'gift_event') && {
              original_item_id: item.itemId,
              original_item_name: item.itemName
            },
            // For event tickets, include ticket holder info
            ...(item.itemType === 'event_ticket' || item.itemType === 'gift_event') && {
              ticket_holder_names: item.ticketHolderNames || [],
              ticket_holder_emails: item.ticketHolderEmails || []
            }
          } : {}
        }))
      };

      // Add gift card info if applied
      if (appliedGiftCard) {
        checkoutData.gift_card_id = appliedGiftCard.id;
        checkoutData.gift_card_code = appliedGiftCard.code;
        checkoutData.gift_card_discount = giftCardDiscount;
      }

      // Add promo code if applied
      if (promoCode && discount > 0) {
        checkoutData.promo_code = promoCode;
        checkoutData.promo_discount = discount;
      }

      if (paymentMethod === 'free') {
        // Handle free purchase (gift card covers full amount)
        checkoutData.payment_method = 'free';
        checkoutData.success_url = `${window.location.origin}/checkout/success`;

        const { data, error } = await supabase.functions.invoke('create-free-order', {
          body: checkoutData
        });

        if (error) throw error;

        if (data?.success) {
          clearCart();
          navigate('/checkout/success', { 
            state: { 
              orderId: data.orderId,
              message: 'Your purchase was completed successfully using your gift card balance!'
            }
          });
        } else {
          throw new Error('Failed to create free order');
        }
      } else if (paymentMethod === 'stripe') {
        // Stripe payment
        checkoutData.payment_method = 'stripe';
        checkoutData.success_url = `${window.location.origin}/checkout/success`;
        checkoutData.cancel_url = `${window.location.origin}/checkout`;

        const { data: stripeData, error } = await supabase.functions.invoke('create-checkout-session', {
          body: checkoutData
        });

        if (error) throw error;

        if (stripeData?.url) {
          window.location.href = stripeData.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else {
        // Mobile Money payment
        setShowMobileMoneyDialog(true);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  // Function to truncate text for display
  const truncateText = (text: string, maxLength: number = 25) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
                                {item.itemType === 'course' || item.itemType === 'gift_course' ? 'Course' : 
                                 item.itemType === 'event_ticket' || item.itemType === 'gift_event' ? 'Event Ticket' :
                                 item.itemType === 'gift_card' ? 'Gift Card' : 
                                 item.itemType}
                              </Badge>
                              {item.itemType.startsWith('gift_') && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                  <Gift className="h-3 w-3 mr-1" />
                                  Gift
                                </Badge>
                              )}
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

                            {/* Display gift metadata if available */}
                            {item.giftMetadata && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="h-4 w-4" />
                                  <span>To: {truncateText(item.giftMetadata.recipientName)}</span>
                                </div>
                                {item.giftMetadata.recipientEmail && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="h-4 w-4" />
                                    <span>Email: {truncateText(item.giftMetadata.recipientEmail)}</span>
                                  </div>
                                )}
                                {item.giftMetadata.personalMessage && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MessageSquare className="h-4 w-4" />
                                    <span>Message: {truncateText(item.giftMetadata.personalMessage)}</span>
                                  </div>
                                )}
                                {item.giftMetadata.amount && (
                                  <div className="text-sm text-gray-600">
                                    Amount: ${item.giftMetadata.amount}
                                  </div>
                                )}
                              </div>
                            )}
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

                {/* Gift Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Gift Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appliedGiftCard ? (
                      <div className="space-y-2 p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Gift Card Applied:</span>
                          <Badge variant="outline" className="bg-green-100">
                            {appliedGiftCard.code}
                          </Badge>
                        </div>
                        <div className="text-sm text-green-600">
                          Remaining Balance: ${appliedGiftCard.remaining_balance.toFixed(2)}
                        </div>
                        <Button
                          onClick={removeGiftCard}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter gift card code"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          disabled={giftCardLoading}
                        />
                        <Button 
                          onClick={applyGiftCard} 
                          variant="outline"
                          disabled={giftCardLoading || !giftCardCode.trim()}
                        >
                          {giftCardLoading ? "..." : "Apply"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method - Updated for Free purchases */}
                {finalAmountUSD > 0 ? (
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
                ) : (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        Gift Card Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700 text-sm">
                        Your gift card balance covers the entire purchase amount. 
                        No additional payment is required.
                      </p>
                    </CardContent>
                  </Card>
                )}

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
                        <span>Promo Discount</span>
                        <span>-<PriceDisplay amount={convertedAmounts.discount} originalCurrency={currentCurrency as any} /></span>
                      </div>
                    )}
                    
                    {giftCardDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Gift Card</span>
                        <span>-<PriceDisplay amount={convertedAmounts.giftCardDiscount} originalCurrency={currentCurrency as any} /></span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <PriceDisplay amount={convertedAmounts.tax} originalCurrency={currentCurrency as any} />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <PriceDisplay 
                        amount={convertedAmounts.final} 
                        originalCurrency={currentCurrency as any} 
                        className={finalAmountUSD <= 0 ? "text-green-600" : ""}
                      />
                    </div>
                    
                    {currentCurrency !== 'USD' && (
                      <div className="text-sm text-gray-500 text-right">
                        Original: ${finalAmountUSD.toFixed(2)} USD
                      </div>
                    )}

                    {finalAmountUSD <= 0 && (
                      <div className="text-sm text-green-600 text-right mt-2">
                        ✓ Fully covered by gift card balance
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white py-3"
                  size="lg"
                >
                  {loading ? "Processing..." : 
                   finalAmountUSD <= 0 ? "Complete Purchase with Gift Card" :
                   paymentMethod === 'stripe' ? "Pay with Card" : "Pay with Mobile Money"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {finalAmountUSD > 0 && (
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
            // Pass metadata to mobile money dialog as well
            metadata: item.giftMetadata ? {
              sender_name: item.giftMetadata.senderName,
              recipient_name: item.giftMetadata.recipientName,
              recipient_email: item.giftMetadata.recipientEmail,
              personal_message: item.giftMetadata.personalMessage,
              amount: item.giftMetadata.amount,
              ...(item.itemType === 'gift_course' || item.itemType === 'gift_event') && {
                original_item_id: item.itemId,
                original_item_name: item.itemName
              },
              ...(item.itemType === 'event_ticket' || item.itemType === 'gift_event') && {
                ticket_holder_names: item.ticketHolderNames || [],
                ticket_holder_emails: item.ticketHolderEmails || []
              }
            } : {}
          }))}
          discount={convertedAmounts.discount + convertedAmounts.giftCardDiscount}
          taxAmount={convertedAmounts.tax}
          promoCode={promoCode}
          giftCardCode={appliedGiftCard?.code}
        />
      )}
    </Layout>
  );
};

export default CheckoutPage;
