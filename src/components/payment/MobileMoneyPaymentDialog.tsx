import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAWAPAY_COUNTRY_CODES, PawapayCountryCode } from '@/constants/pawapayCountries';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Smartphone, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { currencyService } from '@/services/currencyService';
import ReactCountryFlag from "react-country-flag";

interface MobileMoneyPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  items: any[];
  discount: number;
  taxAmount: number;
  promoCode: string;
}

const MobileMoneyPaymentDialog: React.FC<MobileMoneyPaymentDialogProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  items,
  discount,
  taxAmount,
  promoCode
}) => {
  const [selectedCountry, setSelectedCountry] = useState<PawapayCountryCode>('Zambia');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Validate amount
    const validAmount = Math.max(amount || 0, 0);
    if (validAmount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setError(null);
    
    // Remove any non-digit characters except the leading + if present
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure phone number format is correct (no + at start, country code included)
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Validate phone number format
    const countryInfo = PAWAPAY_COUNTRY_CODES[selectedCountry];
    const expectedPrefix = countryInfo.dialCode.substring(1); // Remove the +
    
    if (!formattedPhone.startsWith(expectedPrefix)) {
      toast.error(`Phone number must start with ${countryInfo.dialCode} for ${selectedCountry}`);
      return;
    }

    setLoading(true);
    
    try {
      // Convert amount to appropriate currency for the selected country
      let finalAmount = validAmount;
      let finalCurrency = currency;
      
      // Convert to local currency if needed
      const countryCurrencyMap: { [key: string]: string } = {
        'Zambia': 'ZMW',
        'Nigeria': 'NGN',
        'Kenya': 'KES',
        'Ghana': 'GHS',
        'Uganda': 'UGX',
        'Tanzania': 'TZS'
      };
      
      const targetCurrency = countryCurrencyMap[selectedCountry];
      if (targetCurrency && targetCurrency !== currency) {
        try {
          const conversion = await currencyService.convertCurrency(validAmount, currency, targetCurrency);
          finalAmount = conversion.convertedAmount;
          finalCurrency = targetCurrency;
          console.log('Currency conversion for PawaPay:', {
            original: `${validAmount} ${currency}`,
            converted: `${finalAmount} ${finalCurrency}`
          });
        } catch (conversionError) {
          console.warn('Currency conversion failed for PawaPay, using original amount:', conversionError);
        }
      }
      
      // Ensure final amount is valid
      if (finalAmount <= 0) {
        throw new Error('Invalid converted amount for payment');
      }

      console.log('Initiating PawaPay payment with:', {
        amount: Math.round(finalAmount * 100),
        currency: finalCurrency,
        msisdn: formattedPhone,
        country: countryInfo.code,
        itemsCount: items.length
      });

      const hasEventTickets = items.some(item => item.item_type === 'event_ticket');
      const returnUrl = hasEventTickets 
        ? `${window.location.origin}/account/orders`
        : `${window.location.origin}/payment/success`;

      const { data, error } = await supabase.functions.invoke('create-pawapay-session', {
        body: {
          amount: Math.round(finalAmount * 100), // Convert to cents
          currency: finalCurrency,
          msisdn: formattedPhone,
          country: countryInfo.code,
          returnUrl,
          items: items.map(item => ({
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: item.title,
            title: item.title,
            quantity: item.quantity,
            price: item.price,
            ticket_holder_names: item.ticket_holder_names || []
          })),
          tax_amount: taxAmount,
          discount_amount: discount,
          promo_code: promoCode || null,
        }
      });

      console.log('PawaPay response:', { data, error });

      if (error) {
        console.error('PawaPay function error:', error);
        setError(error.message || 'Failed to initiate payment');
        toast.error('Failed to initiate mobile money payment: ' + (error.message || 'Unknown error'));
        return;
      }

      if (data?.redirectUrl) {
        console.log('Redirecting to PawaPay:', data.redirectUrl);
        window.location.href = data.redirectUrl;
      } else {
        console.error('No redirect URL in response:', data);
        setError('No redirect URL returned from payment provider');
        toast.error('Failed to get payment link from provider');
      }
    } catch (error) {
      console.error('Error initiating PawaPay payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Failed to initiate mobile money payment: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedCountryInfo = PAWAPAY_COUNTRY_CODES[selectedCountry];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl shadow-xl border-0">
        <DialogHeader className="space-y-4 pb-2">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full mx-auto mb-2">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            Mobile Money Payment
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
            Complete your payment using mobile money. Select your country and enter your mobile number to proceed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* Amount Summary */}
          <div className="p-6 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-100">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                <PriceDisplay amount={amount} originalCurrency={currency as any} />
              </p>
            </div>
          </div>

          {/* Country Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Select Country</Label>
            <Select value={selectedCountry} onValueChange={(value: PawapayCountryCode) => setSelectedCountry(value)}>
              <SelectTrigger className="h-12 border-gray-300 rounded-xl hover:border-gray-400 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors">
                <SelectValue>
                  <span className="flex items-center gap-3">
                    <ReactCountryFlag
                      countryCode={selectedCountryInfo.code}
                      svg
                      style={{
                        width: '1.5em',
                        height: '1.5em',
                      }}
                      title={selectedCountry}
                    />
                    <span className="font-medium text-gray-900">{selectedCountry}</span>
                    <span className="text-gray-500">{selectedCountryInfo.dialCode}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-0 shadow-lg">
                {Object.entries(PAWAPAY_COUNTRY_CODES).map(([country, info]) => (
                  <SelectItem 
                    key={country} 
                    value={country}
                    className="rounded-lg focus:bg-orange-50/50"
                  >
                    <span className="flex items-center gap-3 py-1">
                      <ReactCountryFlag
                        countryCode={info.code}
                        svg
                        style={{
                          width: '1.5em',
                          height: '1.5em',
                        }}
                        title={country}
                      />
                      <span className="font-medium text-gray-900">{country}</span>
                      <span className="text-gray-500">{info.dialCode}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
            <div className="flex rounded-xl overflow-hidden shadow-sm border border-gray-300 hover:border-gray-400 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
              <div className="flex items-center px-4 bg-gray-50 border-r border-gray-300">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ReactCountryFlag
                    countryCode={selectedCountryInfo.code}
                    svg
                    style={{
                      width: '1.2em',
                      height: '1.2em',
                    }}
                    title={selectedCountry}
                  />
                  {selectedCountryInfo.dialCode}
                </span>
              </div>
              <Input
                placeholder="Enter your mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 border-0 focus:ring-0 rounded-l-none h-12 text-gray-900 placeholder-gray-500"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your number without the country code (e.g., 968554225 for {selectedCountryInfo.dialCode}968554225)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading || !phoneNumber.trim()}
              className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
            You will be redirected to complete the payment on your mobile device.
            Please ensure you have sufficient balance in your mobile money account.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileMoneyPaymentDialog;
