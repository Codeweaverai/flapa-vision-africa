import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { 
  CreditCard, 
  Lock, 
  Shield, 
  CheckCircle2,
  Loader2,
  Calendar,
  User,
  MapPin,
  Building,
  Globe,
  Zap,
  Clock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import PriceDisplay from '@/components/currency/PriceDisplay';
import ReactCountryFlag from "react-country-flag";

// Country data with cities
const COUNTRIES = [
  { code: 'US', name: 'United States', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'] },
  { code: 'GB', name: 'United Kingdom', cities: ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow'] },
  { code: 'CA', name: 'Canada', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'] },
  { code: 'ZA', name: 'South Africa', cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth'] },
  { code: 'NG', name: 'Nigeria', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'] },
  { code: 'KE', name: 'Kenya', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'] },
  { code: 'GH', name: 'Ghana', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast'] },
  { code: 'ZM', name: 'Zambia', cities: ['Lusaka', 'Ndola', 'Kitwe', 'Kabwe', 'Livingstone'] },
  { code: 'TZ', name: 'Tanzania', cities: ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha', 'Mbeya'] },
  { code: 'UG', name: 'Uganda', cities: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara'] },
  { code: 'AU', name: 'Australia', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { code: 'DE', name: 'Germany', cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { code: 'FR', name: 'France', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'] },
  { code: 'IT', name: 'Italy', cities: ['Rome', 'Milan', 'Naples', 'Turin', 'Palermo'] },
  { code: 'ES', name: 'Spain', cities: ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza'] },
  { code: 'BR', name: 'Brazil', cities: ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza'] },
  { code: 'IN', name: 'India', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai'] },
  { code: 'CN', name: 'China', cities: ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu'] },
  { code: 'JP', name: 'Japan', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'] },
  { code: 'KR', name: 'South Korea', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] },
  { code: 'AE', name: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman'] },
  { code: 'SA', name: 'Saudi Arabia', cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam'] },
  { code: 'EG', name: 'Egypt', cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said'] },
  { code: 'MA', name: 'Morocco', cities: ['Casablanca', 'Rabat', 'Fes', 'Marrakesh', 'Tangier'] },
];

interface DirectCardPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
  items: Array<{
    item_id: string;
    item_type: string;
    item_name: string;
    quantity: number;
    price: number;
    metadata?: any;
  }>;
  discount: number;
  taxAmount: number;
  processingFee: number;
  promoCode?: string;
  giftCardCode?: string;
}

const DirectCardPaymentDialog: React.FC<DirectCardPaymentDialogProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
  items,
  discount,
  taxAmount,
  processingFee,
  promoCode,
  giftCardCode
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedCity, setSelectedCity] = useState('');
  
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  
  const [billingAddress, setBillingAddress] = useState({
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });

  // Update cities when country changes
  useEffect(() => {
    setSelectedCity('');
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    if (country && country.cities.length > 0) {
      setBillingAddress(prev => ({ ...prev, city: '', country: selectedCountry }));
    }
  }, [selectedCountry]);

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);
  const cities = selectedCountryData?.cities || [];

  const handleCardPayment = async () => {
    if (!validateCardDetails()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency,
        items: items,
        tax_amount: Math.round(taxAmount * 100),
        processing_fee: Math.round(processingFee * 100),
        discount_amount: Math.round(discount * 100),
        card: {
          number: cardDetails.number.replace(/\s/g, ''),
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear,
          cvv: cardDetails.cvv
        },
        billing: {
          streetAddress: billingAddress.streetAddress,
          city: billingAddress.city || selectedCity,
          state: billingAddress.state,
          postalCode: billingAddress.postalCode,
          country: selectedCountry,
          firstName: cardDetails.cardholderName.split(' ')[0] || '',
          lastName: cardDetails.cardholderName.split(' ').slice(1).join(' ') || ''
        },
        bearer: 'merchant' as const,
        promo_code: promoCode,
        gift_card_code: giftCardCode
      };

      const { data, error } = await supabase.functions.invoke('lenco-card-payment', {
        body: paymentData
      });

      if (error) {
        throw new Error(error.message || 'Failed to process card payment');
      }

      if (data.success) {
        if (data.requires3DS && data.redirectUrl) {
          // Redirect to 3DS authentication
          window.location.href = data.redirectUrl;
        } else {
          // Payment processed successfully without 3DS
          toast.success('Payment processed successfully!');
          onClose();
          
          // Store payment reference for verification
          if (data.reference) {
            localStorage.setItem('lastCardPaymentAttempt', JSON.stringify({
              reference: data.reference,
              orderId: data.order_id,
              timestamp: new Date().toISOString()
            }));
          }

          // Redirect to success page
          window.location.href = `/card-success?reference=${data.reference}&order_id=${data.order_id}`;
        }
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Card payment error:', error);
      setError(error.message || 'Failed to process card payment');
      toast.error(error.message || 'Failed to process card payment');
    } finally {
      setLoading(false);
    }
  };

  const validateCardDetails = (): boolean => {
    if (!cardDetails.number.trim() || cardDetails.number.replace(/\s/g, '').length < 16) {
      toast.error('Please enter a valid card number');
      return false;
    }

    if (!cardDetails.expiryMonth || !cardDetails.expiryYear) {
      toast.error('Please enter card expiry date');
      return false;
    }

    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast.error('Please enter CVV');
      return false;
    }

    if (!cardDetails.cardholderName.trim()) {
      toast.error('Please enter cardholder name');
      return false;
    }

    if (!billingAddress.streetAddress.trim()) {
      toast.error('Please enter billing address');
      return false;
    }

    if (!billingAddress.city && !selectedCity) {
      toast.error('Please enter city');
      return false;
    }

    if (!billingAddress.postalCode.trim()) {
      toast.error('Please enter postal code');
      return false;
    }

    return true;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({ ...prev, number: formatted }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="space-y-4 pb-2 px-6 pt-6">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-2">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">
            Direct Card Payment
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm leading-relaxed">
            Securely pay with your credit or debit card. We support Visa, Mastercard, and American Express.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Amount Summary */}
            <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <div className="text-center">
                <p className="text-sm font-medium text-white/90 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-white">
                  <PriceDisplay amount={amount} originalCurrency={currency as any} />
                </p>
              </div>
            </div>

            {/* Security Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-800">Encrypted</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Instant</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Shield className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-800">3D Secure</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <Globe className="h-4 w-4 text-indigo-600" />
                <span className="text-xs font-medium text-indigo-800">Global</span>
              </div>
            </div>

            {/* Card Details Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardholderName" className="text-sm font-medium text-gray-700">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, cardholderName: e.target.value }))}
                  className="mt-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className="mt-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-700">Expiry Date</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="expiryMonth"
                      placeholder="MM"
                      value={cardDetails.expiryMonth}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, expiryMonth: e.target.value.replace(/\D/g, '').substring(0, 2) }))}
                      maxLength={2}
                      className="h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                    />
                    <Input
                      id="expiryYear"
                      placeholder="YY"
                      value={cardDetails.expiryYear}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, expiryYear: e.target.value.replace(/\D/g, '').substring(0, 2) }))}
                      maxLength={2}
                      className="h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) }))}
                    maxLength={4}
                    className="mt-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Billing Address
              </h4>
              
              <div className="space-y-4">
                {/* Country Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-xl hover:border-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                      <SelectValue>
                        <span className="flex items-center gap-3">
                          <ReactCountryFlag
                            countryCode={selectedCountry}
                            svg
                            style={{
                              width: '1.5em',
                              height: '1.5em',
                              borderRadius: '4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            }}
                            title={selectedCountryData?.name}
                          />
                          <span className="font-medium text-gray-900">{selectedCountryData?.name}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg min-w-[320px] max-h-[300px]">
                      {COUNTRIES.map((country) => (
                        <SelectItem 
                          key={country.code} 
                          value={country.code}
                          className="rounded-lg focus:bg-blue-50/50"
                        >
                          <span className="flex items-center gap-3 py-1">
                            <ReactCountryFlag
                              countryCode={country.code}
                              svg
                              style={{
                                width: '1.5em',
                                height: '1.5em',
                                borderRadius: '4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                              }}
                              title={country.name}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-sm">{country.name}</span>
                              <span className="text-xs text-gray-500">{country.code}</span>
                            </div>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">City</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-12 border-gray-300 rounded-xl hover:border-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Select your city">
                        {selectedCity || "Select your city"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg max-h-[200px]">
                      {cities.map((city) => (
                        <SelectItem 
                          key={city} 
                          value={city}
                          className="rounded-lg focus:bg-blue-50/50"
                        >
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="streetAddress" className="text-sm font-medium text-gray-700">Street Address</Label>
                  <Input
                    id="streetAddress"
                    placeholder="123 Main Street"
                    value={billingAddress.streetAddress}
                    onChange={(e) => setBillingAddress(prev => ({ ...prev, streetAddress: e.target.value }))}
                    className="mt-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="NY"
                      value={billingAddress.state}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                      className="mt-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="10001"
                      value={billingAddress.postalCode}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="mt-1 h-12 rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Why Pay with Card?
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Instant payment processing and confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Bank-level security with 3D Secure protection</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Accepted worldwide with multiple currency support</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-gray-700">PCI DSS compliant secure payment processing</span>
                </div>
              </div>
            </div>

            {/* Supported Cards Preview */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-900 mb-3 text-center">Supported Cards</h4>
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="outline" className="px-3 py-1 border-blue-200 text-blue-700">
                  Visa
                </Badge>
                <Badge variant="outline" className="px-3 py-1 border-red-200 text-red-700">
                  Mastercard
                </Badge>
                <Badge variant="outline" className="px-3 py-1 border-blue-300 text-blue-800">
                  American Express
                </Badge>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom of scrollable area */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  className="flex-1 h-12 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCardPayment} 
                  disabled={loading || !cardDetails.number.trim() || !cardDetails.cardholderName.trim()}
                  className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay Now
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Security Info */}
              <div className="text-xs text-gray-500 text-center leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Lock className="h-3 w-3 text-green-500" />
                  <span className="font-medium">Your payment is secure</span>
                </div>
                All card details are encrypted and processed securely. We never store your full card information.
                Payments are protected by 3D Secure authentication.
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectCardPaymentDialog;
