import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { PAWAPAY_COUNTRY_CODES } from '@/constants/pawapayCountries';
import { useMobileOperators } from '@/hooks/useMobileOperators';
import { 
  DollarSign, 
  Smartphone, 
  Building2, 
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Banknote,
  Globe
} from 'lucide-react';

interface EnhancedWithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onWithdrawSuccess?: () => void;
}

interface MobileMoneyData {
  country: string;
  operator: string;
  phoneNumber: string;
}

const EnhancedWithdrawDialog: React.FC<EnhancedWithdrawDialogProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onWithdrawSuccess
}) => {
  const [activeTab, setActiveTab] = useState('mobile-money');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [mobileMoneyData, setMobileMoneyData] = useState<MobileMoneyData>({
    country: 'ZMB',
    operator: '',
    phoneNumber: ''
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { user } = useAuth();
  const { currentCurrency, convertPrice, formatPrice } = useCurrency();

  const { operators, isLoading: isLoadingOperators } = useMobileOperators(mobileMoneyData.country);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const convertedAmount = await convertPrice(1, 'USD');
        setExchangeRate(convertedAmount);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        toast.error('Failed to fetch exchange rate');
        setExchangeRate(1);
      }
    };

    fetchExchangeRate();
  }, [currentCurrency, convertPrice]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWithdrawAmount(e.target.value);
  };

  const handleMobileMoneyChange = (field: keyof MobileMoneyData, value: string) => {
    setMobileMoneyData(prev => ({ ...prev, [field]: value }));
    setValidationErrors(prev => ({ ...prev, [field]: '' })); // Clear validation error
  };

  const validateMobileMoneyForm = () => {
    let errors: { [key: string]: string } = {};

    if (!mobileMoneyData.country) {
      errors.country = 'Please select a country';
    }
    if (!mobileMoneyData.operator) {
      errors.operator = 'Please select an operator';
    }
    if (!mobileMoneyData.phoneNumber) {
      errors.phoneNumber = 'Please enter a phone number';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMobileMoneyWithdraw = async () => {
    if (!validateMobileMoneyForm()) return;

    setIsSubmitting(true);
    try {
      // Sanitize phone number - remove all non-digits, leading zeros, and country code prefixes
      let sanitizedPhone = mobileMoneyData.phoneNumber.replace(/\D/g, '');
      
      // Remove leading zeros
      sanitizedPhone = sanitizedPhone.replace(/^0+/, '');
      
      // Remove country code if present (assuming it starts with the country code)
      const countryCode = PAWAPAY_COUNTRY_CODES[mobileMoneyData.country];
      if (countryCode && sanitizedPhone.startsWith(countryCode)) {
        sanitizedPhone = sanitizedPhone.substring(countryCode.length);
      }
      
      // Ensure we have a valid phone number (should be 9-10 digits for most countries)
      if (sanitizedPhone.length < 7 || sanitizedPhone.length > 12) {
        toast.error('Please enter a valid phone number');
        return;
      }

      console.log('Mobile Money Withdrawal:', {
        availableBalance,
        withdrawAmount: parseFloat(withdrawAmount),
        exchangeRate,
        localCurrency: currentCurrency,
        usdAmountToDeduct: withdrawAmount ? parseFloat(withdrawAmount) / exchangeRate : 0
      });

      const { data, error } = await supabase.functions.invoke('pawapay-payout', {
        body: {
          amount: parseFloat(withdrawAmount),
          currency: currentCurrency,
          phoneNumber: sanitizedPhone, // Use sanitized phone number
          country: mobileMoneyData.country,
          operator: mobileMoneyData.operator
        }
      });

      if (error) throw error;

      toast.success('Withdrawal request submitted successfully!');
      onWithdrawSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankWithdraw = () => {
    // Placeholder for bank withdrawal logic
    toast.info('Bank withdrawal is not yet implemented.');
  };

  const handleCryptoWithdraw = () => {
    // Placeholder for crypto withdrawal logic
    toast.info('Crypto withdrawal is not yet implemented.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="mobile-money" className="w-full">
          <TabsList>
            <TabsTrigger value="mobile-money">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile Money
            </TabsTrigger>
            <TabsTrigger value="bank">
              <Building2 className="h-4 w-4 mr-2" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="crypto">
              <CreditCard className="h-4 w-4 mr-2" />
              Crypto
            </TabsTrigger>
          </TabsList>
          <Separator className="my-4" />
          
          <TabsContent value="mobile-money" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Money Withdrawal</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select onValueChange={(value) => handleMobileMoneyChange('country', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAWAPAY_COUNTRY_CODES).map(([countryCode, countryName]) => (
                          <SelectItem key={countryCode} value={countryCode}>{countryName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.country && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="operator">Operator</Label>
                    <Select onValueChange={(value) => handleMobileMoneyChange('operator', value)} disabled={isLoadingOperators || !mobileMoneyData.country}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {operators?.map((operator) => (
                          <SelectItem key={operator.name} value={operator.name}>{operator.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.operator && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.operator}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input 
                    type="tel" 
                    id="phoneNumber" 
                    placeholder="Enter phone number" 
                    value={mobileMoneyData.phoneNumber}
                    onChange={(e) => handleMobileMoneyChange('phoneNumber', e.target.value)}
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid gap-4">
              <div>
                <Label htmlFor="withdrawAmount">Withdraw Amount (USD)</Label>
                <Input 
                  type="number" 
                  id="withdrawAmount" 
                  placeholder="Enter amount to withdraw" 
                  value={withdrawAmount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Available Balance: {formatPrice(availableBalance, 'USD')}
              </div>
            </div>

            <Button onClick={handleMobileMoneyWithdraw} disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Withdraw via Mobile Money'}
            </Button>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle>Bank Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Withdraw funds directly to your bank account.</p>
                <Button onClick={handleBankWithdraw}>Withdraw via Bank Transfer</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto">
            <Card>
              <CardHeader>
                <CardTitle>Crypto Withdrawal</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Withdraw funds in cryptocurrency.</p>
                <Button onClick={handleCryptoWithdraw}>Withdraw via Crypto</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedWithdrawDialog;
