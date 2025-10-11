
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Percent, 
  Clock, 
  Shield, 
  Wallet, 
  Smartphone, 
  Building2, 
  TrendingUp, 
  CheckCircle2,
  Sparkles,
  DollarSign,
  ArrowRight
} from 'lucide-react';

const PricingPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-orange-500/10 animate-pulse" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-6 py-2 rounded-full mb-6 animate-scale-in">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Transparent Pricing</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                Keep More of What You Earn
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Simple, straightforward pricing with no hidden fees. Focus on creating amazing content while we handle the rest.
              </p>
            </div>
          </div>
        </section>

        {/* Main Pricing Breakdown */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Creator Earnings Card */}
            <Card className="border-2 border-orange-200 dark:border-orange-900/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 animate-pulse">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Your Earnings</h3>
                </div>
                
                <div className="text-center py-8">
                  <div className="text-7xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-4">
                    92%
                  </div>
                  <p className="text-lg text-muted-foreground">
                    of every course or event sale goes directly to you
                  </p>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Maximum earnings for creators</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>No setup or monthly fees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Unlimited courses and events</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Fee Card */}
            <Card className="border-2 border-purple-200 dark:border-purple-900/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in hover-scale">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-orange-600 animate-pulse">
                    <Percent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Platform Fee</h3>
                </div>
                
                <div className="text-center py-8">
                  <div className="text-7xl font-bold bg-gradient-to-r from-purple-500 to-orange-600 bg-clip-text text-transparent mb-4">
                    8%
                  </div>
                  <p className="text-lg text-muted-foreground">
                    covers hosting, support, and platform maintenance
                  </p>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <span>24/7 platform support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <span>Marketing tools included</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Fee Card */}
          <div className="max-w-3xl mx-auto mt-8 animate-fade-in">
            <Card className="border-2 border-muted shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Processing Fee</h4>
                      <p className="text-sm text-muted-foreground">Standard payment processing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">2.9%</div>
                    <p className="text-sm text-muted-foreground">+ applicable taxes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Payment Timeline */}
        <section className="py-16 bg-gradient-to-r from-orange-50 via-purple-50 to-orange-50 dark:from-orange-950/20 dark:via-purple-950/20 dark:to-orange-950/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-4 py-2 rounded-full mb-4">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Payment Schedule</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">How Payouts Work</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Understanding your earnings timeline and withdrawal process
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <Card className="relative overflow-hidden animate-fade-in hover-scale">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-600 opacity-10 rounded-bl-full" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 text-white font-bold text-xl mb-4">
                    1
                  </div>
                  <h3 className="text-xl font-bold mb-3">Purchase Made</h3>
                  <p className="text-muted-foreground">
                    When a student purchases your course or event ticket, the payment is processed securely.
                  </p>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className="relative overflow-hidden animate-fade-in hover-scale">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-orange-600 opacity-10 rounded-bl-full" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-orange-600 text-white font-bold text-xl mb-4">
                    2
                  </div>
                  <h3 className="text-xl font-bold mb-3">7-Day Hold</h3>
                  <p className="text-muted-foreground">
                    Funds remain in "pending" status for 7 days to ensure transaction security and prevent fraud.
                  </p>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className="relative overflow-hidden animate-fade-in hover-scale">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-600 opacity-10 rounded-bl-full" />
                <CardContent className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 text-white font-bold text-xl mb-4">
                    3
                  </div>
                  <h3 className="text-xl font-bold mb-3">Available Balance</h3>
                  <p className="text-muted-foreground">
                    After 7 days, funds move to your available balance, ready for withdrawal anytime.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Withdrawal Methods */}
        <section className="py-16 container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-orange-600 text-white px-4 py-2 rounded-full mb-4">
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Flexible Withdrawals</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Multiple Payout Options</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the withdrawal method that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mobile Money */}
            <Card className="border-2 border-orange-200 dark:border-orange-900/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in hover-scale group">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Smartphone className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Mobile Money</h3>
                  <p className="text-muted-foreground mb-6">
                    Fast and convenient withdrawals directly to your mobile money account
                  </p>
                  <div className="space-y-2 text-sm w-full">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Available in 19 African countries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Instant transfers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>No minimum withdrawal amount</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card className="border-2 border-purple-200 dark:border-purple-900/50 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in hover-scale group">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-orange-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Building2 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Bank Account</h3>
                  <p className="text-muted-foreground mb-6">
                    Secure transfers directly to your bank account via Stripe Connect
                  </p>
                  <div className="space-y-2 text-sm w-full">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>International support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>Secure Stripe processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span>2-3 business day transfers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security Section */}
        <section className="py-16 bg-gradient-to-r from-purple-50 via-orange-50 to-purple-50 dark:from-purple-950/20 dark:via-orange-950/20 dark:to-purple-950/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-primary/20 shadow-xl animate-fade-in">
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0">
                      <div className="p-6 rounded-full bg-gradient-to-br from-orange-500 via-purple-600 to-orange-600 animate-pulse">
                        <Shield className="h-16 w-16 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-3xl font-bold mb-4">Secure & Transparent Transactions</h2>
                      <p className="text-lg text-muted-foreground mb-6">
                        Your earnings are protected with bank-level security. Every transaction is encrypted, monitored, and compliant with international payment standards.
                      </p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">PCI DSS Compliant</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">256-bit SSL Encryption</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">Real-time Fraud Detection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">Transparent Reporting</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Earning?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators already earning with SkillPulse
            </p>
            <a 
              href="/become-creator"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-300 hover-scale shadow-lg"
            >
              <span>Become a Creator</span>
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PricingPage;
