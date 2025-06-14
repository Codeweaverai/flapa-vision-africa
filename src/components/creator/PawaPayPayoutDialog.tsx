
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Smartphone, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { requestCreatorPayout } from '@/services/creatorPaymentService';
import { useAuth } from '@/contexts/AuthContext';

interface PawaPayPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

const MOBILE_OPERATORS = {
  'Zambia': [
    { value: 'AIRTEL_OAPI_ZMB', label: 'Airtel Money', code: '+260' },
    { value: 'MTN_MOMO_ZMB', label: 'MTN Mobile Money', code: '+260' }
  ],
  'Kenya': [
    { value: 'SAFARICOM_KEN', label: 'M-Pesa', code: '+254' },
    { value: 'AIRTEL_KEN', label: 'Airtel Money', code: '+254' }
  ],
  'Nigeria': [
    { value: 'MTN_MOMO_NGA', label: 'MTN MoMo', code: '+234' },
    { value: 'AIRTEL_NGA', label: 'Airtel Money', code: '+234' }
  ],
  'Malawi': [
    { value: 'AIRTEL_MWI', label: 'Airtel Money', code: '+265' },
    { value: 'TNM_MWI', label: 'TNM Mpamba', code: '+265' }
  ]
};

const COUNTRY_CODES = {
  'Zambia': 'ZMB',
  'Kenya': 'KEN', 
  'Nigeria': 'NGA',
  'Malawi': 'MWI'
};

const PawaPayPayoutDialog: React.FC<PawaPayPayoutDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  currency,
  onSuccess
}) => {
  const [amount, setAmount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<keyof typeof MOBILE_OPERATORS>('Zambia');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePayout = async () => {
    if (!user) return;

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return;
    }

    if (!selectedOperator || !phoneNumber.trim()) {
      return;
    }

    setLoading(true);
    try {
      const success = await requestCreatorPayout(user.id, {
        amount: payoutAmount,
        payout_method: 'mobile_money',
        mobile_money_details: {
          phone_number: phoneNumber,
          operator: selectedOperator,
          country: COUNTRY_CODES[selectedCountry]
        }
      });

      if (success) {
        onSuccess();
        onOpenChange(false);
        setAmount('');
        setPhoneNumber('');
        setSelectedOperator('');
      }
    } catch (error) {
      console.error('Mobile money payout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const withdrawAmount = parseFloat(amount) || 0;
  const isValidAmount = withdrawAmount >= 5 && withdrawAmount <= availableBalance;
  const selectedOperatorInfo = MOBILE_OPERATORS[selectedCountry].find(op => op.value === selectedOperator);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Money Payout
          </DialogTitle>
          <DialogDescription>
            Withdraw your earnings to your mobile money account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {currency} {availableBalance.toFixed(2)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Funds available for withdrawal (after 7-day hold period)
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency}
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12"
                min="5"
                max={availableBalance}
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={selectedCountry} onValueChange={(value: keyof typeof MOBILE_OPERATORS) => {
              setSelectedCountry(value);
              setSelectedOperator('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(MOBILE_OPERATORS).map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mobile Money Provider</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger>
                <SelectValue placeholder="Select your mobile money provider" />
              </SelectTrigger>
              <SelectContent>
                {MOBILE_OPERATORS[selectedCountry].map((operator) => (
                  <SelectItem key={operator.value} value={operator.value}>
                    {operator.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <div className="flex">
              <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50">
                <span className="text-sm font-medium">
                  {selectedOperatorInfo?.code || '+260'}
                </span>
              </div>
              <Input
                placeholder="Enter your mobile number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your number without the country code
            </p>
          </div>

          {withdrawAmount > 0 && !isValidAmount && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {withdrawAmount < 5 
                  ? "Minimum withdrawal amount is $5.00"
                  : "Amount exceeds available balance"
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Minimum withdrawal: $5.00</div>
              <div>• Processing time: 5-30 minutes</div>
              <div>• Platform fee: 8% (already deducted)</div>
              <div>• Powered by PawaPay</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePayout} 
            disabled={!isValidAmount || !selectedOperator || !phoneNumber.trim() || loading}
            className="min-w-[100px]"
          >
            {loading ? "Processing..." : "Withdraw"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PawaPayPayoutDialog;
