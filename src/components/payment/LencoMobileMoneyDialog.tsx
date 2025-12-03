import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  Smartphone, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Shield, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Globe, 
  Clock,
  BadgeCheck,
  SmartphoneCharging,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { currencyService } from '@/services/currencyService';
import ReactCountryFlag from "react-country-flag";

interface LencoMobileMoneyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  items: any[];
  discount: number;
  taxAmount: number;
  promoCode: string;
  appliedGiftCardId?: string;
  giftCardDiscount?: number;
  isGiftPurchase?: boolean;
}

// Zambia specific operators
const ZAMBIA_OPERATORS = [
  { id: 'airtel', name: 'Airtel Money', icon: '🔵' },
  { id: 'mtn', name: 'MTN Mobile Money', icon: '🟡' }
] as const;

// Country info for Zambia
const ZAMBIA_INFO = {
  name: 'Zambia',
  code: 'ZM',
  dialCode: '+260',
  currency: 'ZMW'
} as const;

interface PaymentStatus {
  status: 'idle' | 'initiated' | 'pending' | 'completed' | 'failed';
  message?: string;
  reference?: string;
  orderId?: string;
}

const LencoMobileMoneyDialog: React.FC<LencoMobileMoneyDialogProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  items,
  discount,
  taxAmount,
  promoCode,
  appliedGiftCardId,
  giftCardDiscount = 0,
  isGiftPurchase = false
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('airtel');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Stop polling when dialog closes
  useEffect(() => {
    if (!isOpen && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setIsPolling(false);
      setPaymentStatus({ status: 'idle' });
    }
  }, [isOpen, pollingInterval]);

  const startPolling = (reference: string) => {
    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('lenco-payment--mobile-status', {
          body: { reference }
        });

        if (error) {
          console.error('Polling error:', error);
          return;
        }

        if (data.success) {
          const status = data.payment_status;
          console.log('Polling status:', status);

          if (status === 'completed') {
            clearInterval(interval);
            setIsPolling(false);
            setPaymentStatus({
              status: 'completed',
              message: 'Payment completed successfully!',
              reference
            });
            toast.success('Payment completed successfully!');
            
            // Close dialog after success
            setTimeout(() => {
              onClose();
              // Redirect to success page
              const hasEventTickets = items.some(item => item.item_type === 'event_ticket');
              const redirectUrl = hasEventTickets 
                ? `/my-orders?payment=success&order_id=${data.order?.id}`
                : `/payment/success?reference=${reference}&order_id=${data.order?.id}`;
              window.location.href = redirectUrl;
            }, 2000);
          } else if (status === 'failed') {
            clearInterval(interval);
            setIsPolling(false);
            setPaymentStatus({
              status: 'failed',
              message: data.order?.reason_for_failure || 'Payment failed',
              reference
            });
            toast.error(`Payment failed: ${data.order?.reason_for_failure || 'Unknown error'}`);
          } else if (status === 'pending_authorization') {
            setPaymentStatus({
              status: 'pending',
              message: 'Waiting for authorization on your phone...',
              reference
            });
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);

    // Stop polling after 10 minutes
    setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setIsPolling(false);
        if (paymentStatus.status === 'pending') {
          setPaymentStatus({
            status: 'failed',
            message: 'Payment authorization timeout. Please try again.',
            reference
          });
          toast.error('Payment authorization timeout. Please try again.');
        }
      }
    }, 600000); // 10 minutes
  };

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Validate phone number format (Zambian number)
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    let formattedPhone = cleanPhone;
    
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Remove country code if present
    if (formattedPhone.startsWith('260')) {
      formattedPhone = formattedPhone.substring(3);
    }
    
    // Ensure phone number is 9 digits
    if (!formattedPhone.match(/^9\d{8}$/)) {
      toast.error('Please enter a valid Zambian mobile number starting with 9 (e.g., 960123456)');
      return;
    }

    // Validate amount
    const validAmount = Math.max(amount || 0, 0);
    if (validAmount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      // Convert amount to ZMW if needed
      let finalAmount = validAmount;
      let finalCurrency = currency;
      
      if (currency !== 'ZMW') {
        try {
          const conversion = await currencyService.convertCurrency(validAmount, currency, 'ZMW');
          finalAmount = conversion.convertedAmount;
          finalCurrency = 'ZMW';
          console.log('Currency conversion for Lenco:', {
            original: `${validAmount} ${currency}`,
            converted: `${finalAmount} ${finalCurrency}`
          });
        } catch (conversionError) {
          console.warn('Currency conversion failed, using original amount:', conversionError);
          // If conversion fails, show warning but proceed
          toast.warning('Unable to convert currency, proceeding with original amount');
        }
      }

      // Ensure minimum amount (if Lenco has minimum)
      if (finalAmount < 1) { // Assuming 1 ZMW minimum
        throw new Error('Amount is too small for mobile money payment');
      }

      console.log('Initiating Lenco mobile money payment:', {
        amount: Math.round(finalAmount * 100), // Convert to cents
        currency: finalCurrency,
        phone: formattedPhone,
        operator: selectedOperator,
        country: 'zm',
        itemsCount: items.length
      });

      const { data, error } = await supabase.functions.invoke('lenco-mobile-money', {
        body: {
          amount: Math.round(finalAmount * 100), // Convert to cents
          currency: finalCurrency,
          phone: `260${formattedPhone}`, // Add country code back
          operator: selectedOperator,
          country: 'zm',
          bearer: 'merchant',
          items: items.map(item => ({
            item_type: item.item_type || item.itemType,
            item_id: item.item_id || item.itemId || item.id,
            item_name: item.item_name || item.itemName || item.title || item.name || 'Item',
            title: item.title || item.name,
            quantity: item.quantity || 1,
            price: item.price || 0,
            ticket_holder_names: item.ticket_holder_names || [],
            ticket_holder_emails: item.ticket_holder_emails || []
          })),
          tax_amount: taxAmount,
          discount_amount: discount,
          promo_code: promoCode || null,
          applied_gift_card_id: appliedGiftCardId || null,
          gift_card_discount: giftCardDiscount,
          is_gift_purchase: isGiftPurchase
        }
      });

      console.log('Lenco response:', { data, error });

      if (error) {
        console.error('Lenco function error:', error);
        setError(error.message || 'Failed to initiate payment');
        toast.error('Failed to initiate mobile money payment: ' + (error.message || 'Unknown error'));
        return;
      }

      if (data.success) {
        const reference = data.data.reference;
        const status = data.data.status;
        
        setPaymentStatus({
          status: status === 'pay-offline' ? 'pending' : 'initiated',
          message: data.data.instructions || data.message,
          reference,
          orderId: data.data.order_id
        });

        toast.success(data.message || 'Payment initiated successfully!');

        if (status === 'pay-offline') {
          // Start polling for status updates
          startPolling(reference);
        } else if (status === 'successful') {
          // Immediate success
          setPaymentStatus({
            status: 'completed',
            message: 'Payment completed successfully!',
            reference
          });
          toast.success('Payment completed successfully!');
          
          setTimeout(() => {
            onClose();
            window.location.href = data.data.return_url || '/payment/success';
          }, 2000);
        }
      } else {
        setError(data.error || 'Failed to initiate payment');
        toast.error('Failed to initiate mobile money payment: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error initiating Lenco payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to initiate mobile money payment: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedOperatorInfo = ZAMBIA_OPERATORS.find(op => op.id === selectedOperator);

  const renderContent = () => {
    if (paymentStatus.status === 'pending') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SmartphoneCharging className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Authorize Payment</h3>
            <p className="text-gray-600 mb-6">
              Please check your {selectedOperatorInfo?.name} phone and authorize the payment.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <h4 className="font-medium text-gray-900">Waiting for Authorization</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    We're waiting for you to authorize the payment on your mobile device.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Reference:</span>
                <span className="text-sm font-medium text-gray-900">{paymentStatus.reference}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending Authorization
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                What to do next:
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Check your phone for a payment request
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Enter your mobile money PIN when prompted
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Wait for payment confirmation
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                if (pollingInterval) clearInterval(pollingInterval);
                setPaymentStatus({ status: 'idle' });
                setIsPolling(false);
              }}
              className="w-full h-12 rounded-xl"
            >
              Cancel Payment
            </Button>
          </div>
        </div>
      );
    }

    if (paymentStatus.status === 'completed') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-6">
              Your payment has been completed successfully.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Payment Confirmed</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your transaction has been processed successfully.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Reference:</span>
                <span className="text-sm font-medium text-gray-900">{paymentStatus.reference}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Order ID:</span>
                <span className="text-sm font-medium text-gray-900">{paymentStatus.orderId}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                onClose();
                window.location.href = `/account/orders?order_id=${paymentStatus.orderId}`;
              }}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium"
            >
              View Order Details
            </Button>
          </div>
        </div>
      );
    }

    if (paymentStatus.status === 'failed') {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h3>
            <p className="text-gray-600 mb-6">
              {paymentStatus.message || 'Payment could not be completed.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Payment Error</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Please try again or contact support if the issue persists.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setPaymentStatus({ status: 'idle' })}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl font-medium"
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              className="w-full h-12 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    // Default payment form
    return (
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Amount Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-white/90 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-white">
              <PriceDisplay amount={amount} originalCurrency={currency as any} />
            </p>
            <p className="text-xs text-white/80 mt-2">Pay with mobile money in Zambia</p>
          </div>
        </div>

        {/* Security Features */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-800">Secure</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-800">Instant</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Globe className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Zambia Only</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">24/7</span>
          </div>
        </div>

        {/* Country Display (Fixed to Zambia) */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Country</Label>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <ReactCountryFlag
              countryCode="ZM"
              svg
              style={{
                width: '2em',
                height: '1.5em',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
              title="Zambia"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{ZAMBIA_INFO.name}</div>
              <div className="text-sm text-gray-500">{ZAMBIA_INFO.dialCode}</div>
            </div>
            <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              Default
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Currently supporting mobile money payments in Zambia only
          </p>
        </div>

        {/* Phone Number Input */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
          <div className="flex rounded-xl overflow-hidden shadow-sm border border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <div className="flex items-center px-4 bg-gray-50 border-r border-gray-300">
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ReactCountryFlag
                  countryCode="ZM"
                  svg
                  style={{
                    width: '1.2em',
                    height: '1.2em',
                    borderRadius: '3px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                  title="Zambia"
                />
                {ZAMBIA_INFO.dialCode}
              </span>
            </div>
            <Input
              placeholder="960123456"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="flex-1 border-0 focus:ring-0 rounded-l-none h-12 text-gray-900 placeholder-gray-500"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Enter your Zambian mobile number starting with 9 (e.g., 960123456)
          </p>
        </div>

        {/* Mobile Money Provider Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Select Mobile Money Provider</Label>
          <div className="grid grid-cols-2 gap-3">
            {ZAMBIA_OPERATORS.map((operator) => (
              <button
                key={operator.id}
                type="button"
                onClick={() => setSelectedOperator(operator.id)}
                className={`p-4 rounded-xl border-2 transition-all ${selectedOperator === operator.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{operator.icon}</span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{operator.name}</div>
                    <div className="text-xs text-gray-500 mt-1">Zambia</div>
                  </div>
                  {selectedOperator === operator.id && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500 ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
          <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-blue-600" />
            How to Pay with {selectedOperatorInfo?.name}
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <span className="text-xs text-gray-700">Enter your mobile number above</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <span className="text-xs text-gray-700">Click "Proceed to Pay"</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <span className="text-xs text-gray-700">Check your phone for payment request</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                4
              </div>
              <span className="text-xs text-gray-700">Enter your mobile money PIN when prompted</span>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            Why Pay with {selectedOperatorInfo?.name}?
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">Secure & encrypted transactions</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">Instant payment confirmation</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">No additional transaction fees</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">24/7 customer support</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
              disabled={loading || isPolling}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading || !phoneNumber.trim() || isPolling}
              className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Initiating...
                </>
              ) : isPolling ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Pay
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Payment Info */}
          <div className="text-xs text-gray-500 text-center leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Lock className="h-3 w-3 text-gray-400" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p>
              Your payment details are encrypted and secure. You will receive a payment request on your mobile device.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && (paymentStatus.status === 'pending' || isPolling)) {
        if (confirm('Payment is still processing. Are you sure you want to close?')) {
          if (pollingInterval) clearInterval(pollingInterval);
          onClose();
        }
      } else {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="space-y-4 pb-2 px-6 pt-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-2">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            {paymentStatus.status === 'pending' ? 'Authorize Payment' :
             paymentStatus.status === 'completed' ? 'Payment Successful' :
             paymentStatus.status === 'failed' ? 'Payment Failed' :
             'Zambia Mobile Money'}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
            {paymentStatus.status === 'pending' ? 'Please authorize the payment on your mobile device' :
             paymentStatus.status === 'completed' ? 'Your payment has been processed successfully' :
             paymentStatus.status === 'failed' ? 'Payment could not be completed' :
             'Pay instantly with Airtel Money or MTN Mobile Money'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LencoMobileMoneyDialog;
