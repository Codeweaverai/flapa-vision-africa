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
  BarChart3
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
      title: "Zero Platform Fees",
      description: "Keep 100% of funds raised during our launch period"
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
      description: "Set your funding goal, timeline, and compelling story with our easy-to-use campaign builder."
    },
    {
      number: "02",
      title: "Customize Rewards",
      description: "Offer exclusive rewards like early access, personalized content, or special mentions to your backers."
    },
    {
      number: "03",
      title: "Share & Promote",
      description: "Leverage built-in sharing tools and our platform promotion to reach your audience."
    },
    {
      number: "04",
      title: "Receive Funds & Deliver",
      description: "Get funded quickly and start delivering on your promises to supporters."
    }
  ];

  const successStories = [
    {
      creator: "Sarah M.",
      category: "Photography Course",
      raised: "$8,250",
      goal: "$5,000",
      backers: "164",
      achievement: "165% funded in 30 days"
    },
    {
      creator: "TechWithJames",
      category: "Coding Bootcamp",
      raised: "$12,400",
      goal: "$10,000",
      backers: "89",
      achievement: "124% funded in 45 days"
    },
    {
      creator: "DesignMastery",
      category: "Creative Software",
      raised: "$6,800",
      goal: "$4,000",
      backers: "203",
      achievement: "170% funded in 21 days"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        {/* Hero Section */}
        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
            <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-6 py-2 text-lg">
                <HeartHandshake className="h-4 w-4 mr-2" />
                Fund Your Creativity
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8">
                Bring Your Ideas to
                <span className="block bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Life with Funding
                </span>
              </h1>
              
              <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                Turn your creative vision into reality with SkillPulse Creator Fundraising. 
                Launch campaigns for your courses, events, and projects while building a community of supporters.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg">
                  <Link to="/creator/dashboard">Start Fundraising</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 font-semibold px-8 py-4 rounded-xl text-lg"
                >
                  View Success Stories
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    $500K+
                  </div>
                  <div className="text-gray-600 font-medium">Total Raised</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    95%
                  </div>
                  <div className="text-gray-600 font-medium">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    2K+
                  </div>
                  <div className="text-gray-600 font-medium">Projects Funded</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    50K+
                  </div>
                  <div className="text-gray-600 font-medium">Supporters</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
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
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardHeader className="text-center pb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Creator-First Benefits
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                We're built for creators, by creators. That's why we offer the best terms in the industry.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  <CardHeader className="pb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-lg mb-2">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-gradient-to-br from-orange-50 to-purple-50">
          <div className="container mx-auto px-4">
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
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 text-center relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {step.number}
                    </div>
                  </div>
                  <CardHeader className="pt-8 pb-4">
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-6 py-2 text-lg">
                <Award className="h-4 w-4 mr-2" />
                Success Stories
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Creators Making an Impact
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                See how creators are using SkillPulse Fundraising to bring their dreams to life.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {successStories.map((story, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-full">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        {story.achievement}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{story.creator}</CardTitle>
                    <CardDescription className="text-gray-600">{story.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Raised:</span>
                        <span className="font-bold text-green-600">{story.raised}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Goal:</span>
                        <span className="font-bold text-gray-700">{story.goal}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Supporters:</span>
                        <span className="font-bold text-orange-600">{story.backers}</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: '165%' }} // This would be dynamic in real implementation
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-2xl max-w-4xl mx-auto overflow-hidden">
              <CardContent className="p-12 text-center text-white">
                <div className="mb-6">
                  <Lightbulb className="h-16 w-16 mx-auto mb-4 text-white/90" />
                </div>
                <h3 className="text-4xl font-bold mb-6">
                  Ready to Fund Your Next Big Idea?
                </h3>
                <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                  Join thousands of creators who have successfully funded their projects through SkillPulse. 
                  Your community is waiting to support your vision.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg">
                    <Link to="/creator/dashboard">Start Your Campaign</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl text-lg"
                  >
                    Learn More
                  </Button>
                </div>
                <p className="text-white/70 mt-6 text-sm">
                  No platform fees • Fast payouts • Full creator control
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
