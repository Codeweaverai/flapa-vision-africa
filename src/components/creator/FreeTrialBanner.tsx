// components/creator/FreeTrialBanner.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Zap, BookOpen, Calendar, X } from 'lucide-react';
import { useTokens } from '@/hooks/useTokens';

const FreeTrialBanner = () => {
  const { tokenBalance, hasFreeTokensAvailable, getAvailableTokens } = useTokens();
  const [dismissed, setDismissed] = React.useState(false);

  if (!hasFreeTokensAvailable() || dismissed) {
    return null;
  }

  const freeTokens = getAvailableTokens().free;

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="bg-green-500 rounded-full p-2 text-white mt-1">
              <Gift className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-green-900 text-lg">
                  Free Trial Active!
                </h3>
                <Badge className="bg-green-500 text-white">
                  {freeTokens} Free Tokens
                </Badge>
              </div>
              <p className="text-green-800">
                You have <strong>{freeTokens} free tokens</strong> to create your first course or event with AI!
              </p>
              <div className="flex items-center space-x-4 text-sm text-green-700">
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>Create 1 full course</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Or 2-3 events</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreeTrialBanner;
