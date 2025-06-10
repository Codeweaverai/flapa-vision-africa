
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PAWAPAY_COUNTRY_CODES, PawapayCountryCode } from '@/constants/pawapayCountries';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Smartphone, CreditCard } from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';

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

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

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
      const hasEventTickets = items.some(item => item.item_type === 'event_ticket');
      const returnUrl = hasEventTickets 
        ? `${window.location.origin}/account/orders`
        : `${window.location.origin}/payment/success`;

      const { data, error } = await supabase.functions.invoke('create-pawapay-session', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          msisdn: formattedPhone,
          country: countryInfo.code,
          returnUrl,
          items: items.map(item => ({
            item_type: item.item_type,
            item_id: item.item_id,
            item_name: item.title,
            quantity: item.quantity,
            price: item.price,
            ticket_holder_names: item.ticket_holder_names || []
          })),
          tax_amount: taxAmount,
          discount_amount: discount,
          promo_code: promoCode || null,
        }
      });

      if (error) throw error;

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL returned from PawaPay');
      }
    } catch (error) {
      console.error('Error initiating PawaPay payment:', error);
      toast.error('Failed to initiate mobile money payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedCountryInfo = PAWAPAY_COUNTRY_CODES[selectedCountry];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Money Payment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Amount Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                <PriceDisplay amount={amount} originalCurrency="USD" />
              </p>
            </div>
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label>Select Country</Label>
            <Select value={selectedCountry} onValueChange={(value: PawapayCountryCode) => setSelectedCountry(value)}>
              <SelectTrigger>
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{selectedCountryInfo.flag}</span>
                    <span>{selectedCountry}</span>
                    <span className="text-gray-500">{selectedCountryInfo.dialCode}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAWAPAY_COUNTRY_CODES).map(([country, info]) => (
                  <SelectItem key={country} value={country}>
                    <span className="flex items-center gap-2">
                      <span>{info.flag}</span>
                      <span>{country}</span>
                      <span className="text-gray-500">{info.dialCode}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <div className="flex">
              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                <span className="text-sm font-medium">
                  {selectedCountryInfo.flag} {selectedCountryInfo.dialCode}
                </span>
              </div>
              <Input
                placeholder="Enter your mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter your number without the country code (e.g., 968554225 for {selectedCountryInfo.dialCode}968554225)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handlePayment} 
              disabled={loading || !phoneNumber.trim()}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {loading ? 'Processing...' : 'Proceed to Pay'}
            </Button>
          </div>

          {/* Payment Info */}
          <div className="text-xs text-gray-500 text-center">
            You will be redirected to complete the payment on your mobile device.
            Please ensure you have sufficient balance in your mobile money account.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileMoneyPaymentDialog;
