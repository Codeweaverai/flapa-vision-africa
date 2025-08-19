
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { Gift, Star, Heart, Sparkles } from 'lucide-react';

const GiftCardsPage = () => {
  const { addToCart } = useCart();
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const predefinedAmounts = [25, 50, 100, 200, 500];

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setAmount(numValue);
    }
  };

  const handleAddGiftCard = async () => {
    if (!senderName || !recipientName || !recipientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    try {
      addToCart({
        itemId: 'gift_card',
        itemType: 'gift_card',
        itemName: `Gift Card - $${amount.toFixed(2)}`,
        price: amount,
        quantity: 1,
        giftMetadata: {
          senderName,
          recipientName,
          recipientEmail,
          personalMessage,
          amount
        }
      });

      toast.success('Gift card added to cart!');
      
      // Reset form
      setSenderName('');
      setRecipientName('');
      setRecipientEmail('');
      setPersonalMessage('');
      setAmount(50);
      setCustomAmount('');
    } catch (error) {
      console.error('Error adding gift card to cart:', error);
      toast.error('Failed to add gift card to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                  <Gift className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gift Cards</h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Give the gift of learning! Purchase a gift card for someone special and let them choose from our amazing courses and events.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Gift Card Preview */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Gift Card Preview</h2>
                
                <Card className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-4 right-4">
                    <Sparkles className="h-6 w-6 text-white/80" />
                  </div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Gift className="h-5 w-5" />
                      <span className="text-sm font-medium">SkillPulse Gift Card</span>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold mb-1">${amount.toFixed(2)}</div>
                      <div className="text-sm text-white/80">Gift Card Value</div>
                    </div>
                    
                    {recipientName && (
                      <div className="mb-4">
                        <div className="text-sm text-white/80">For:</div>
                        <div className="font-medium">{recipientName}</div>
                      </div>
                    )}
                    
                    {senderName && (
                      <div className="text-xs text-white/70">
                        From: {senderName}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Benefits */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Gift Card Benefits:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Valid for 1 year from purchase date</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>Can be used for any course or event</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-500" />
                      <span>Delivered instantly via email</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Purchase Gift Card</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-medium">Select Amount</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {predefinedAmounts.map((preAmount) => (
                        <Button
                          key={preAmount}
                          variant={amount === preAmount && !customAmount ? "default" : "outline"}
                          onClick={() => handleAmountSelect(preAmount)}
                          className="h-12"
                        >
                          ${preAmount}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="mt-3">
                      <Label htmlFor="customAmount" className="text-sm">Or enter custom amount</Label>
                      <Input
                        id="customAmount"
                        type="number"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Sender Information */}
                  <div>
                    <Label htmlFor="senderName">Your Name *</Label>
                    <Input
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Recipient Information */}
                  <div>
                    <Label htmlFor="recipientName">Recipient's Name *</Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Enter recipient's name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="recipientEmail">Recipient's Email *</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter recipient's email"
                    />
                  </div>

                  {/* Personal Message */}
                  <div>
                    <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                    <Textarea
                      id="personalMessage"
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      placeholder="Add a personal message for the recipient..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={handleAddGiftCard}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isLoading ? 'Adding...' : `Add $${amount.toFixed(2)} Gift Card to Cart`}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GiftCardsPage;
