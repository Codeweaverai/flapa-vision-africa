// components/creator/TokenUsageDialog.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Zap, AlertTriangle, ArrowRight, Gift } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';

interface TokenUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureType: string;
  requiredTokens: number;
  featureName: string;
  onContinue?: () => void;
}

const TokenUsageDialog: React.FC<TokenUsageDialogProps> = ({
  open,
  onOpenChange,
  featureType,
  requiredTokens,
  featureName,
  onContinue
}) => {
  const navigate = useNavigate();
  const { tokenBalance, getAvailableTokens, hasEnoughTokens } = useTokens();
  
  const availableTokens = getAvailableTokens();
  const hasFreeTokens = availableTokens.free >= requiredTokens && !tokenBalance?.has_used_free_trial;
  const hasPaidTokens = availableTokens.paid >= requiredTokens;
  const canUseFeature = hasEnoughTokens(requiredTokens);

  const handleTopUp = () => {
    onOpenChange(false);
    navigate('/creator/tokens');
  };

  const handleUseFreeTokens = () => {
    if (onContinue) {
      onContinue();
    }
    onOpenChange(false);
  };

  const handleUsePaidTokens = () => {
    if (onContinue) {
      onContinue();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            Token Required for {featureName}
          </DialogTitle>
          <DialogDescription>
            This action requires {requiredTokens} tokens. Choose how you'd like to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Token Balance Summary */}
          <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600">
                    <Gift className="h-4 w-4" />
                    <span className="font-semibold">Free Tokens</span>
                  </div>
                  <div className="text-lg font-bold">{availableTokens.free}</div>
                  <div className="text-xs text-gray-500">available</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-600">
                    <Coins className="h-4 w-4" />
                    <span className="font-semibold">Paid Tokens</span>
                  </div>
                  <div className="text-lg font-bold">{availableTokens.paid}</div>
                  <div className="text-xs text-gray-500">available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Options */}
          {hasFreeTokens && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-green-700">
                      <Gift className="h-4 w-4" />
                      <span className="font-semibold">Use Free Trial</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Use {requiredTokens} free tokens from your trial
                    </p>
                  </div>
                  <Button 
                    onClick={handleUseFreeTokens}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Use Free
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {hasPaidTokens && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-orange-700">
                      <Coins className="h-4 w-4" />
                      <span className="font-semibold">Use Paid Tokens</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      Use {requiredTokens} tokens from your balance
                    </p>
                  </div>
                  <Button 
                    onClick={handleUsePaidTokens}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Use Paid
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!canUseFeature && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-red-700">Insufficient Tokens</div>
                    <p className="text-sm text-red-600 mt-1">
                      You need {requiredTokens} tokens but only have {availableTokens.free + availableTokens.paid} available.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          {!canUseFeature && (
            <Button
              onClick={handleTopUp}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Coins className="h-4 w-4 mr-2" />
              Top Up Tokens
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenUsageDialog;
