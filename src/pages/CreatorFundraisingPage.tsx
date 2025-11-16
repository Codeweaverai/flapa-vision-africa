import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HeartHandshake, 
  Target, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp,
  Globe,
  CheckCircle,
  DollarSign,
  Clock,
  Rocket,
  Star,
  Award,
  Lightbulb,
  BarChart3,
  Sparkles,
  Gift,
  TrendingUp as TrendingUpIcon,
  Crown,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CreatorFundraisingPage = () => {
  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Goal-Oriented Campaigns",
      description: "Set clear funding targets for specific projects, courses, or equipment with transparent progress tracking."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Quick Setup",
      description: "Launch your fundraising campaign in minutes with our intuitive campaign builder and templates."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Industry-leading security with encrypted transactions and reliable payment processing."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Reach",
      description: "Accept support from fans and learners worldwide with multi-currency support."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Real-time Analytics",
      description: "Track campaign performance, donor demographics, and funding trends in real-time."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Community Building",
      description: "Engage your supporters with updates, milestones, and exclusive content for backers."
    }
  ];

  const benefits = [
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Low 5% Platform Fee",
      description: "Small transaction fee for platform maintenance and hosting needs"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Fast Payouts",
      description: "Receive funds within 3-5 business days"
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Campaign Promotion",
      description: "Get featured across SkillPulse platforms"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Performance Insights",
      description: "Detailed analytics to optimize your campaigns"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Campaign",
      description: "Set your funding goal, timeline, and compelling story with our easy-to-use campaign builder.",
      icon: <Target className="h-6 w-6" />
    },
    {
      number: "02",
      title: "Customize Rewards",
      description: "Offer exclusive rewards like early access, personalized content, or special mentions to your backers.",
      icon: <Gift className="h-6 w-6" />
    },
    {
      number: "03",
      title: "Share & Promote",
      description: "Leverage built-in sharing tools and our platform promotion to reach your audience.",
      icon: <Users className="h-6 w-6" />
    },
    {
      number: "04",
      title: "Receive Funds & Deliver",
      description: "Get funded quickly and start delivering on your promises to supporters.",
      icon: <DollarSign className="h-6 w-6" />
    }
  ];

  const trustFactors = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Reliable",
      description: "Bank-level security for all transactions and creator funds"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Support",
      description: "Available to creators in 20+ African countries with local payment methods"
    },
    {
      icon: <TrendingUpIcon className="h-8 w-8" />,
      title: "Proven Success",
      description: "95% campaign success rate with over $500K raised to date"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Growing Community",
      description: "Join 50,000+ supporters and 2,000+ successful creators"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        {/* Enhanced Hero Section with Background Image */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(249, 115, 22, 0.9), rgba(147, 51, 234, 0.8)), url('https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/7918.jpg')`
            }}
          >
            <div className="absolute inset-0">
              <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/40 to-purple-400/40 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/30 to-pink-400/30 rounded-full blur-2xl animate-pulse delay-1000"></div>
              <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/35 to-purple-500/35 rounded-full blur-xl animate-pulse delay-500"></div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/6 w-6 h-6 bg-white/20 rounded-full animate-bounce"></div>
            <div className="absolute top-1/3 right-1/5 w-4 h-4 bg-orange-300/30 rounded-full animate-bounce delay-300"></div>
            <div className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-purple-300/25 rounded-full animate-bounce delay-700"></div>
            <div className="absolute top-1/2 right-1/4 w-5 h-5 bg-pink-300/20 rounded-full animate-bounce delay-500"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-white/20 backdrop-blur-sm text-white border-0 px-6 py-2 text-lg animate-fade-in">
                <Sparkles className="h-4 w-4 mr-2" />
                Fund Your Creativity
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8 text-white drop-shadow-2xl">
                Bring Your Ideas to
                <span className="block bg-gradient-to-r from-orange-200 to-purple-200 bg-clip-text text-transparent">
                  Life with Funding
                </span>
              </h1>
              
              <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
                Turn your creative vision into reality with SkillPulse Creator Fundraising. 
                Launch campaigns for your courses, events, and projects while building a community of supporters.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-lg">
                  <Link to="/creator/dashboard">Start Fundraising</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg backdrop-blur-sm"
                >
                  <Link to="/how-fundraising-works">
                    <Sparkles className="h-5 w-5 mr-2" />
                    See How It Works
                  </Link>
                </Button>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 backdrop-blur-sm bg-white/10 rounded-2xl p-8 border border-white/20">
                {[
                  { number: "$500K+", label: "Total Raised" },
                  { number: "95%", label: "Success Rate" },
                  { number: "2K+", label: "Projects Funded" },
                  { number: "50K+", label: "Supporters" }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                      {stat.number}
                    </div>
                    <div className="text-white/80 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Enhanced Animations */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50/30"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Powerful Fundraising Features
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Everything you need to run successful fundraising campaigns and bring your creative projects to life.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:-translate-y-2 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardHeader className="text-center pb-4 relative z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl mb-2 group-hover:text-orange-600 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <p className="text-gray-600 text-center group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-white to-purple-50/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-purple-600"></div>
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-6 py-2 text-lg shadow-lg">
                <Crown className="h-4 w-4 mr-2" />
                Creator-First Benefits
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Simple & Transparent Pricing
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                We believe in fair compensation for creators. Our small 5% fee ensures platform sustainability while you keep the majority of your funds.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index} 
                  className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 border-l-4 border-l-orange-500"
                >
                  <CardHeader className="pb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-lg mb-2 text-center">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Simple Pricing Card */}
            <div className="mt-16 max-w-2xl mx-auto">
              <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-3xl text-white overflow-hidden">
                <CardContent className="p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <DollarSign className="h-8 w-8 text-white/90" />
                    <h3 className="text-2xl font-bold">Simple & Fair Pricing</h3>
                  </div>
                  <div className="text-5xl font-bold mb-2">5%</div>
                  <p className="text-white/90 text-lg mb-6">Platform Fee</p>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">95%</div>
                      <p className="text-white/80">You Keep</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">5%</div>
                      <p className="text-white/80">Platform Fee</p>
                    </div>
                  </div>
                  <p className="text-white/80 mb-6">
                    No hidden fees. No surprises. Just a simple 5% transaction fee that covers platform maintenance, 
                    secure payments, and ongoing development.
                  </p>
                  <Button 
                    asChild
                    size="lg" 
                    className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Link to="/creator/dashboard">Start Your Campaign</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust & Security Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Trusted by Creators
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Join thousands of creators who trust SkillPulse to bring their creative visions to life
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {trustFactors.map((factor, index) => (
                <Card 
                  key={index} 
                  className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group text-center"
                >
                  <CardHeader className="pb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {factor.icon}
                    </div>
                    <CardTitle className="text-lg mb-2">{factor.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{factor.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced How It Works Section - INCREASED CARD HEIGHT */}
        <section className="py-20 bg-gradient-to-br from-orange-50/50 to-purple-50/50 relative">
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-10 w-20 h-20 bg-orange-200/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-1/4 right-10 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                How Fundraising Works
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Launch your first campaign in four simple steps and start receiving support from your community.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Connecting lines */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-500/30 to-purple-600/30 -z-10"></div>
                  )}
                  {/* Increased card height with min-h-[320px] */}
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 group hover:-translate-y-2 text-center relative overflow-hidden min-h-[320px] flex flex-col">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {step.number}
                      </div>
                    </div>
                    <CardHeader className="pt-12 pb-4 flex-shrink-0">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white opacity-90 group-hover:scale-110 transition-transform duration-300">
                        {step.icon}
                      </div>
                      <CardTitle className="text-lg group-hover:text-orange-600 transition-colors duration-300">
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center">
                      <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            {/* Additional CTA for detailed guide */}
            <div className="text-center mt-12">
              <Button 
                asChild
                variant="outline" 
                size="lg"
                className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold px-8 py-3 rounded-xl"
              >
                <Link to="/how-fundraising-works" className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  View Detailed Guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-purple-600/10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-3xl max-w-4xl mx-auto overflow-hidden relative">
              {/* Animated background elements */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"></div>
              </div>
              
              <CardContent className="p-12 text-center text-white relative z-10">
                <div className="mb-6">
                  <Lightbulb className="h-16 w-16 mx-auto mb-4 text-white/90 drop-shadow-lg" />
                </div>
                <h3 className="text-4xl font-bold mb-6 drop-shadow-lg">
                  Ready to Fund Your Next Big Idea?
                </h3>
                <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto drop-shadow">
                  Join thousands of creators who have successfully funded their projects through SkillPulse. 
                  Your community is waiting to support your vision.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-lg">
                    <Link to="/creator/dashboard">Start Your Campaign</Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outline" 
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg backdrop-blur-sm"
                  >
                    <Link to="/how-fundraising-works" className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2" />
                      See Detailed Guide
                    </Link>
                  </Button>
                </div>
                <p className="text-white/70 mt-6 text-sm">
                  Low 5% platform fee • Fast payouts • Full creator control • 24/7 Support
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CreatorFundraisingPage;
