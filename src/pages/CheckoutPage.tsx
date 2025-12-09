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
import { 
  CreditCard, 
  Smartphone, 
  Plus, 
  Minus, 
  Trash2, 
  Gift, 
  CheckCircle, 
  User, 
  Mail, 
  MessageSquare,
  Sparkles,
  Zap,
  Shield,
  Lock,
  ArrowRight,
  AlertCircle,
  Info,
  Clock,
  Globe,
  Phone
} from 'lucide-react';
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
  
  // Only show PawaPay payment method
  const [paymentMethod, setPaymentMethod] = useState<'pawapay'>('pawapay');
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
    processingFee: number;
    final: number;
    discount: number;
    giftCardDiscount: number;
  }>({
    total: 0,
    tax: 0,
    processingFee: 0,
    final: 0,
    discount: 0,
    giftCardDiscount: 0
  });
  
  const totalAmountUSD = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const TAX_RATE = 0.015; // 1.5% tax
  const PROCESSING_FEE_RATE = 0.029; // 2.9% processing fee
  const taxAmountUSD = totalAmountUSD * TAX_RATE;
  
  // Calculate processing fee on the amount after discounts but before tax
  const amountAfterDiscountsUSD = totalAmountUSD - discount - giftCardDiscount;
  const processingFeeUSD = amountAfterDiscountsUSD * PROCESSING_FEE_RATE;
  
  const finalAmountBeforeDiscountsUSD = totalAmountUSD + taxAmountUSD;
  const finalAmountUSD = amountAfterDiscountsUSD + taxAmountUSD + processingFeeUSD;

  // Automatically set payment method to 'free' when amount is 0
  useEffect(() => {
    if (finalAmountUSD <= 0) {
      // If amount is 0 (gift card covers all), we don't need payment method
    }
  }, [finalAmountUSD]);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  // Convert amounts to current currency
  useEffect(() => {
    const convertAmounts = async () => {
      try {
        const [convertedTotal, convertedTax, convertedProcessingFee, convertedDiscount, convertedGiftCardDiscount] = await Promise.all([
          convertPrice(totalAmountUSD, 'USD'),
          convertPrice(taxAmountUSD, 'USD'),
          convertPrice(processingFeeUSD, 'USD'),
          convertPrice(discount, 'USD'),
          convertPrice(giftCardDiscount, 'USD')
        ]);
        
        const convertedFinal = convertedTotal + convertedTax + convertedProcessingFee - convertedDiscount - convertedGiftCardDiscount;
        
        setConvertedAmounts({
          total: convertedTotal,
          tax: convertedTax,
          processingFee: convertedProcessingFee,
          final: convertedFinal,
          discount: convertedDiscount,
          giftCardDiscount: convertedGiftCardDiscount
        });
      } catch (error) {
        console.error('Error converting amounts:', error);
        setConvertedAmounts({
          total: totalAmountUSD,
          tax: taxAmountUSD,
          processingFee: processingFeeUSD,
          final: finalAmountUSD,
          discount: discount,
          giftCardDiscount: giftCardDiscount
        });
      }
    };

    convertAmounts();
  }, [totalAmountUSD, taxAmountUSD, processingFeeUSD, finalAmountUSD, discount, giftCardDiscount, convertPrice, currentCurrency]);

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

    // If amount is 0 (fully covered by gift card), handle free purchase
    if (finalAmountUSD <= 0) {
      setLoading(true);
      try {
        const checkoutData: any = {
          items: items.map(item => ({
            item_id: item.itemId,
            item_type: item.itemType,
            item_name: item.itemName,
            quantity: item.quantity,
            price: item.price,
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
          })),
          payment_method: 'free',
          success_url: `${window.location.origin}/checkout/success`,
          gift_card_id: appliedGiftCard?.id,
          gift_card_code: appliedGiftCard?.code,
          gift_card_discount: giftCardDiscount
        };

        if (promoCode && discount > 0) {
          checkoutData.promo_code = promoCode;
          checkoutData.promo_discount = discount;
        }

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
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to complete purchase');
      } finally {
        setLoading(false);
      }
      return;
    }

    // For non-zero amounts with PawaPay
    setLoading(true);
    try {
      setShowMobileMoneyDialog(true);
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Failed to initiate payment');
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-purple-50/30 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-12">
              <Badge className="mb-4 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Secure Checkout
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Complete Your Purchase
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Review your items and choose your preferred payment method
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Enhanced Cart Items */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-white" />
                      </div>
                      Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {items.map((item) => (
                      <div key={item.itemId} className="flex flex-col p-6 border border-slate-100 rounded-2xl bg-white/50 hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                              {item.itemName}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-orange-200">
                                {item.itemType === 'course' || item.itemType === 'gift_course' ? 'Course' : 
                                 item.itemType === 'event_ticket' || item.itemType === 'gift_event' ? 'Event Ticket' :
                                 item.itemType === 'gift_card' ? 'Gift Card' : 
                                 item.itemType}
                              </Badge>
                              {item.itemType.startsWith('gift_') && (
                                <Badge className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200">
                                  <Gift className="h-3 w-3 mr-1" />
                                  Gift
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3 space-y-1">
                              <div className="text-xl font-bold text-slate-800">
                                <PriceDisplay 
                                  amount={item.price} 
                                  originalCurrency="USD"
                                />
                              </div>
                              {currentCurrency !== 'USD' && (
                                <div className="text-sm text-slate-500">
                                  Original: ${item.price.toFixed(2)} USD
                                </div>
                              )}
                            </div>

                            {/* Enhanced gift metadata display */}
                            {item.giftMetadata && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-100 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                  <User className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium">To: {truncateText(item.giftMetadata.recipientName)}</span>
                                </div>
                                {item.giftMetadata.recipientEmail && (
                                  <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Mail className="h-4 w-4 text-purple-500" />
                                    <span>Email: {truncateText(item.giftMetadata.recipientEmail)}</span>
                                  </div>
                                )}
                                {item.giftMetadata.personalMessage && (
                                  <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                    <span>Message: {truncateText(item.giftMetadata.personalMessage)}</span>
                                  </div>
                                )}
                                {item.giftMetadata.amount && (
                                  <div className="text-sm font-medium text-green-600">
                                    Gift Amount: ${item.giftMetadata.amount}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {item.itemType === 'event_ticket' && (
                              <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                                  className="h-8 w-8 p-0 hover:bg-white hover:shadow-md transition-all duration-200"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-bold w-8 text-center text-slate-800">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                                  className="h-8 w-8 p-0 hover:bg-white hover:shadow-md transition-all duration-200"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.itemId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
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

              {/* Enhanced Payment Details */}
              <div className="space-y-6">
                {/* Enhanced Promo Code */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                      Promo Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="border-slate-200 focus:border-orange-300 transition-colors duration-200"
                      />
                      <Button 
                        onClick={applyPromoCode} 
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                      >
                        Apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Gift Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                        <Gift className="h-3 w-3 text-white" />
                      </div>
                      Gift Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {appliedGiftCard ? (
                      <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-green-800">Gift Card Applied</span>
                          <Badge className="bg-green-500 text-white border-0">
                            {appliedGiftCard.code}
                          </Badge>
                        </div>
                        <div className="text-sm text-green-700">
                          Remaining Balance: ${appliedGiftCard.remaining_balance.toFixed(2)}
                        </div>
                        <Button
                          onClick={removeGiftCard}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          Remove Gift Card
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Input
                          placeholder="Enter gift card code"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                          disabled={giftCardLoading}
                          className="border-slate-200 focus:border-purple-300 transition-colors duration-200"
                        />
                        <Button 
                          onClick={applyGiftCard} 
                          variant="outline"
                          disabled={giftCardLoading || !giftCardCode.trim()}
                          className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 disabled:opacity-50"
                        >
                          {giftCardLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced Payment Method - Only PawaPay Mobile Money */}
                {finalAmountUSD > 0 ? (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-slate-100">
                      <CardTitle className="flex items-center gap-3 text-slate-800">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                          <Smartphone className="h-3 w-3 text-white" />
                        </div>
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* PawaPay Mobile Money Option with Orange-Purple Gradient */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-purple-600 p-px">
                        <div className="relative bg-white rounded-[15px] p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <Smartphone className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                  Mobile Money
                                </h3>
                                <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                  <Globe className="h-3 w-3" />
                                  Available in 19+ African countries via PawaPay
                                </p>
                              </div>
                            </div>
                            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                              paymentMethod === 'pawapay' 
                                ? 'border-orange-500 bg-orange-500' 
                                : 'border-slate-300'
                            }`}>
                              {paymentMethod === 'pawapay' && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                          </div>
                          
                          {/* PawaPay Features */}
                          <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                              <Shield className="h-4 w-4 text-orange-500" />
                              <span className="text-xs font-medium text-slate-700">Secure Payment</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
                              <Zap className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium text-slate-700">Instant Processing</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                              <Globe className="h-4 w-4 text-orange-500" />
                              <span className="text-xs font-medium text-slate-700">Multi-Country</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
                              <CheckCircle className="h-4 w-4 text-purple-500" />
                              <span className="text-xs font-medium text-slate-700">Verified</span>
                            </div>
                          </div>
                          
                          {/* Country Info */}
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Info className="h-4 w-4 text-orange-500" />
                              <span>Supports: Zambia, Kenya, Uganda, Ghana, Nigeria, Tanzania, Rwanda, Senegal, Cote d'Ivoire, Cameroon, and more</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Method Info */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50/50 to-purple-50/50 rounded-2xl border border-orange-100">
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-slate-800 mb-1">Mobile Money Process</p>
                            <ul className="space-y-1 text-slate-600">
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <span>You'll enter your phone number on the next screen</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                <span>Redirect to PawaPay's secure payment page</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                <span>Enter your mobile money PIN to complete payment</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-2xl rounded-3xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-green-800">
                        <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        Gift Card Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-green-700 text-sm leading-relaxed">
                        Your gift card balance covers the entire purchase amount. 
                        No additional payment is required.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Enhanced Order Total */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-slate-100">
                    <CardTitle className="flex items-center gap-3 text-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                      Order Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal</span>
                      <PriceDisplay amount={convertedAmounts.total} originalCurrency={currentCurrency as any} />
                    </div>
                    
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Promo Discount</span>
                        <span>-<PriceDisplay amount={convertedAmounts.discount} originalCurrency={currentCurrency as any} /></span>
                      </div>
                    )}
                    
                    {giftCardDiscount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Gift Card</span>
                        <span>-<PriceDisplay amount={convertedAmounts.giftCardDiscount} originalCurrency={currentCurrency as any} /></span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-slate-700">
                      <span>Tax</span>
                      <PriceDisplay amount={convertedAmounts.tax} originalCurrency={currentCurrency as any} />
                    </div>

                    {/* Processing Fee */}
                    <div className="flex justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>Processing Fee (2.9%)</span>
                        <div className="group relative">
                          <Info className="h-3 w-3 text-slate-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 text-center z-10">
                            Payment processing fee charged by payment providers
                          </div>
                        </div>
                      </div>
                      <PriceDisplay amount={convertedAmounts.processingFee} originalCurrency={currentCurrency as any} />
                    </div>
                    
                    <Separator className="bg-slate-200" />
                    
                    <div className="flex justify-between font-bold text-xl">
                      <span className="text-slate-800">Total</span>
                      <PriceDisplay 
                        amount={convertedAmounts.final} 
                        originalCurrency={currentCurrency as any} 
                        className={finalAmountUSD <= 0 ? "text-green-600" : "text-slate-800"}
                      />
                    </div>
                    
                    {currentCurrency !== 'USD' && (
                      <div className="text-sm text-slate-500 text-right">
                        Original: ${finalAmountUSD.toFixed(2)} USD
                      </div>
                    )}

                    {finalAmountUSD <= 0 && (
                      <div className="text-sm text-green-600 text-right mt-2 font-medium">
                        ✓ Fully covered by gift card balance
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Processing Fee Notice */}
                {finalAmountUSD > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Processing Fee Notice</p>
                        <p>A 2.9% processing fee is applied to cover payment gateway costs. This fee ensures secure and reliable payment processing.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Checkout Button with Orange-Purple Gradient */}
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 via-orange-400 to-purple-600 hover:from-orange-600 hover:via-orange-500 hover:to-purple-700 text-white py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0 relative overflow-hidden group"
                  size="lg"
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-orange-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : finalAmountUSD <= 0 ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        <span>Complete Purchase with Gift Card</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-5 w-5" />
                        <span>Pay with Mobile Money</span>
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </div>
                </Button>

                {/* Security Badge */}
                <div className="text-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Secure SSL Encryption</span>
                    <span className="text-slate-400">•</span>
                    <span>256-bit Security</span>
                    <span className="text-slate-400">•</span>
                    <span>PCI Compliant</span>
                  </div>
                </div>
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
        />
      )}
    </Layout>
  );
};

export default CheckoutPage;
