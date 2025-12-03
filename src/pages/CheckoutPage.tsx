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
import LencoMobileMoneyDialog from '@/components/payment/LencoMobileMoneyDialog';

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
  
  // Only show two payment methods: pawapay and lenco_mobile_money
  const [paymentMethod, setPaymentMethod] = useState<'pawapay' | 'lenco_mobile_money'>('lenco_mobile_money');
  const [promoCode, setPromoCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [giftCardDiscount, setGiftCardDiscount] = useState(0);
  const [appliedGiftCard, setAppliedGiftCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [showMobileMoneyDialog, setShowMobileMoneyDialog] = useState(false);
  const [showLencoMobileMoneyDialog, setShowLencoMobileMoneyDialog] = useState(false);
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

    // For non-zero amounts, show the appropriate dialog
    setLoading(true);
    try {
      if (paymentMethod === 'pawapay') {
        setShowMobileMoneyDialog(true);
      } else if (paymentMethod === 'lenco_mobile_money') {
        setShowLencoMobileMoneyDialog(true);
      }
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

                {/* Enhanced Payment Method - Only showing two mobile money options */}
                {finalAmountUSD > 0 ? (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-500/5 to-purple-600/5 border-b border-slate-100">
                      <CardTitle className="flex items-center gap-3 text-slate-800">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                          <CreditCard className="h-3 w-3 text-white" />
                        </div>
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Mobile Money - Lenco Zambia (DEFAULT) */}
                        <div 
                          onClick={() => setPaymentMethod('lenco_mobile_money')}
                          className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                            paymentMethod === 'lenco_mobile_money' 
                              ? 'border-2 border-orange-500 bg-gradient-to-r from-orange-50 to-orange-50' 
                              : 'border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                            paymentMethod === 'lenco_mobile_money' 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-slate-300'
                          }`}>
                            {paymentMethod === 'lenco_mobile_money' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                              <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 flex items-center gap-2">
                                Mobile Money
                                {paymentMethod === 'lenco_mobile_money' && (
                                  <Badge className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                  
                               </Badge>
                                )}
                              </div>
                              <div className="text-sm text-slate-600 flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                Available in Zambia Only
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Money - PawaPay */}
                        <div 
                          onClick={() => setPaymentMethod('pawapay')}
                          className={`flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 cursor-pointer ${
                            paymentMethod === 'pawapay' 
                              ? 'border-2 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-50' 
                              : 'border border-slate-100 hover:border-purple-200 hover:bg-purple-50/50'
                          }`}
                        >
                          <div className={`flex items-center justify-center w-5 h-5 rounded-full border ${
                            paymentMethod === 'pawapay' 
                              ? 'border-purple-500 bg-purple-500' 
                              : 'border-slate-300'
                          }`}>
                            {paymentMethod === 'pawapay' && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 cursor-pointer flex-1">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                              <Smartphone className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800">Mobile Money</div>
                              <div className="text-sm text-slate-600">Available in 19+ African countries</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Payment Method Help */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Need help choosing?</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-xs text-slate-600">
                              <strong>Zambia Mobile Money:</strong> For customers in Zambia with Airtel or MTN
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-xs text-slate-600">
                              <strong> Mobile Money Africa:</strong> For customers in other African countries
                            </span>
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

                {/* Enhanced Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white py-4 text-lg font-semibold shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 rounded-2xl border-0"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : finalAmountUSD <= 0 ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Complete Purchase with Gift Card
                    </div>
                  ) : paymentMethod === 'lenco_mobile_money' ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Pay with Zambia Mobile Money
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5" />
                      Pay with PawaPay Mobile Money
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  )}
                </Button>

                {/* Security Badge */}
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Secure SSL Encryption • 256-bit Security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {finalAmountUSD > 0 && (
        <>
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

          {/* Lenco Mobile Money Dialog */}
          <LencoMobileMoneyDialog
            isOpen={showLencoMobileMoneyDialog}
            onClose={() => {
              setShowLencoMobileMoneyDialog(false);
              setLoading(false);
            }}
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
            appliedGiftCardId={appliedGiftCard?.id}
            giftCardDiscount={giftCardDiscount}
            isGiftPurchase={items.some(item => item.itemType.startsWith('gift_'))}
          />
        </>
      )}
    </Layout>
  );
};

export default CheckoutPage;
