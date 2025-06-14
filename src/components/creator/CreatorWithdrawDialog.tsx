
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
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Smartphone } from 'lucide-react';
import { requestCreatorPayout } from '@/services/creatorPaymentService';
import { useAuth } from '@/contexts/AuthContext';
import WithdrawDialog from './WithdrawDialog';
import PawaPayPayoutDialog from './PawaPay PayoutDialog';

interface CreatorWithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  currency: string;
  onSuccess: () => void;
}

const CreatorWithdrawDialog: React.FC<CreatorWithdrawDialogProps> = ({
  open,
  onOpenChange,
  availableBalance,
  currency,
  onSuccess
}) => {
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [mobileMoneyDialogOpen, setMobileMoneyDialogOpen] = useState(false);

  const handleStripeWithdraw = () => {
    onOpenChange(false);
    setStripeDialogOpen(true);
  };

  const handleMobileMoneyWithdraw = () => {
    onOpenChange(false);
    setMobileMoneyDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Choose Withdrawal Method
            </DialogTitle>
            <DialogDescription>
              Select how you'd like to receive your earnings
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

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-auto p-4 flex flex-col items-start space-y-2"
                onClick={handleStripeWithdraw}
                disabled={availableBalance < 5}
              >
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Stripe Connect</span>
                </div>
                <div className="text-sm text-muted-foreground text-left">
                  Transfer to your connected Stripe account (bank transfer)
                </div>
                <div className="text-xs text-green-600">
                  Processing: 2-7 business days
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="w-full h-auto p-4 flex flex-col items-start space-y-2"
                onClick={handleMobileMoneyWithdraw}
                disabled={availableBalance < 5}
              >
                <div className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span className="font-medium">Mobile Money</span>
                </div>
                <div className="text-sm text-muted-foreground text-left">
                  Transfer to your mobile money account via PawaPay
                </div>
                <div className="text-xs text-green-600">
                  Processing: 5-30 minutes
                </div>
              </Button>
            </div>

            {availableBalance < 5 && (
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="text-sm text-amber-700">
                  Minimum withdrawal amount is $5.00
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stripe Withdraw Dialog */}
      <WithdrawDialog
        open={stripeDialogOpen}
        onOpenChange={setStripeDialogOpen}
        availableBalance={availableBalance}
        currency={currency}
        onSuccess={onSuccess}
      />

      {/* Mobile Money Withdraw Dialog */}
      <PawaPayPayoutDialog
        open={mobileMoneyDialogOpen}
        onOpenChange={setMobileMoneyDialogOpen}
        availableBalance={availableBalance}
        currency={currency}
        onSuccess={onSuccess}
      />
    </>
  );
};

export default CreatorWithdrawDialog;
