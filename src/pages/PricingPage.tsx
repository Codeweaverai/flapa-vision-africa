
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: "Basic",
      price: 29,
      description: "Perfect for beginners",
      features: [
        "Access to basic courses",
        "Community support",
        "Basic certificates",
        "Email support"
      ]
    },
    {
      name: "Pro",
      price: 79,
      description: "For serious learners",
      popular: true,
      features: [
        "Access to all courses",
        "Priority support",
        "Verified certificates",
        "1-on-1 mentoring sessions",
        "Advanced projects"
      ]
    },
    {
      name: "Enterprise",
      price: 199,
      description: "For teams and organizations",
      features: [
        "Everything in Pro",
        "Team management",
        "Custom courses",
        "Analytics dashboard",
        "Dedicated support"
      ]
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="section-container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-gray-600">
              Select the perfect plan for your learning journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;
