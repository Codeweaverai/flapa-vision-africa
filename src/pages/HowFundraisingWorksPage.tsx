import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target,
  Gift,
  Users,
  DollarSign,
  Zap,
  Shield,
  BarChart3,
  Rocket,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  FileText,
  Video,
  Download,
  Share2,
  HeartHandshake,
  Sparkles,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const HowFundraisingWorksPage = () => {
  const detailedSteps = [
    {
      number: "01",
      title: "Plan Your Campaign",
      description: "Define your project goals, target audience, and funding needs",
      icon: <Target className="h-8 w-8" />,
      details: [
        "Set clear, achievable funding goals",
        "Define your project timeline (30, 45, or 60 days)",
        "Identify your target audience and supporters",
        "Plan your reward tiers and backer benefits",
        "Create a compelling project story and vision"
      ],
      tips: [
        "Research similar successful campaigns",
        "Set a realistic funding goal that covers your needs",
        "Plan your campaign duration based on your audience size"
      ],
      estimatedTime: "1-2 hours",
      resources: [
        { name: "Campaign Planning Template", icon: <FileText className="h-4 w-4" />, type: "template" },
        { name: "Goal Setting Guide", icon: <Download className="h-4 w-4" />, type: "guide" }
      ]
    },
    {
      number: "02",
      title: "Create Your Campaign Page",
      description: "Build an engaging campaign page with compelling content",
      icon: <FileText className="h-8 w-8" />,
      details: [
        "Write a compelling project description",
        "Upload high-quality images and videos",
        "Set up attractive reward tiers",
        "Add team members and collaborators",
        "Configure funding goals and stretch goals"
      ],
      tips: [
        "Use high-quality visuals that tell your story",
        "Keep your description clear and engaging",
        "Show your passion and expertise",
        "Include a compelling video (increases success by 30%)"
      ],
      estimatedTime: "2-3 hours",
      resources: [
        { name: "Video Creation Guide", icon: <Video className="h-4 w-4" />, type: "guide" },
        { name: "Image Optimization Tips", icon: <Download className="h-4 w-4" />, type: "tips" }
      ]
    },
    {
      number: "03",
      title: "Set Up Rewards & Perks",
      description: "Create attractive rewards for your backers at different contribution levels",
      icon: <Gift className="h-8 w-8" />,
      details: [
        "Design 3-5 reward tiers with clear benefits",
        "Include early bird specials for quick momentum",
        "Offer digital and physical rewards",
        "Set realistic delivery timelines",
        "Create limited edition rewards for exclusivity"
      ],
      tips: [
        "Offer rewards that cost you little but mean a lot to backers",
        "Include a low-tier option for wider participation",
        "Create a high-tier option for super supporters",
        "Make rewards personal and meaningful"
      ],
      estimatedTime: "1-2 hours",
      resources: [
        { name: "Reward Tier Examples", icon: <FileText className="h-4 w-4" />, type: "examples" },
        { name: "Pricing Strategy Guide", icon: <Download className="h-4 w-4" />, type: "guide" }
      ]
    },
    {
      number: "04",
      title: "Launch & Promote",
      description: "Launch your campaign and spread the word to your network",
      icon: <Rocket className="h-8 w-8" />,
      details: [
        "Schedule your launch for optimal timing",
        "Share across social media platforms",
        "Email your existing network and mailing list",
        "Reach out to influencers and communities",
        "Use built-in sharing tools and analytics"
      ],
      tips: [
        "Launch on a Tuesday or Wednesday for maximum visibility",
        "Secure 30% of your goal from friends and family first",
        "Post regular updates to keep momentum",
        "Engage with every backer personally"
      ],
      estimatedTime: "Ongoing during campaign",
      resources: [
        { name: "Social Media Templates", icon: <Share2 className="h-4 w-4" />, type: "templates" },
        { name: "Email Outreach Scripts", icon: <FileText className="h-4 w-4" />, type: "scripts" }
      ]
    },
    {
      number: "05",
      title: "Manage & Engage",
      description: "Keep your backers engaged and manage campaign progress",
      icon: <Users className="h-8 w-8" />,
      details: [
        "Post regular campaign updates",
        "Respond to backer comments and questions",
        "Share milestones and achievements",
        "Adjust strategy based on analytics",
        "Create stretch goals for extra momentum"
      ],
      tips: [
        "Post updates at least 2-3 times per week",
        "Be transparent about progress and challenges",
        "Create excitement around stretch goals",
        "Thank every backer personally when possible"
      ],
      estimatedTime: "1-2 hours daily",
      resources: [
        { name: "Update Template Library", icon: <FileText className="h-4 w-4" />, type: "templates" },
        { name: "Engagement Analytics", icon: <BarChart3 className="h-4 w-4" />, type: "analytics" }
      ]
    },
    {
      number: "06",
      title: "Complete & Deliver",
      description: "Successfully complete your campaign and deliver rewards",
      icon: <DollarSign className="h-8 w-8" />,
      details: [
        "Receive funds within 3-5 business days",
        "Send thank you messages to all backers",
        "Fulfill rewards according to your timeline",
        "Provide tracking information for physical items",
        "Share project completion updates"
      ],
      tips: [
        "Plan your reward fulfillment before launching",
        "Communicate clearly about delivery timelines",
        "Over-deliver on rewards when possible",
        "Keep backers informed about any delays"
      ],
      estimatedTime: "Varies by project scale",
      resources: [
        { name: "Fulfillment Checklist", icon: <CheckCircle className="h-4 w-4" />, type: "checklist" },
        { name: "Backer Communication Templates", icon: <FileText className="h-4 w-4" />, type: "templates" }
      ]
    }
  ];

  const quickStats = [
    { number: "30%", label: "More successful with video" },
    { number: "85%", label: "Funded in first 72 hours" },
    { number: "2.5x", label: "Higher success with updates" },
    { number: "95%", label: "Delivery rate on promises" }
  ];

  const bestPractices = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Build Momentum Early",
      description: "Secure 30% of your funding goal in the first 48 hours to build credibility and attract more backers."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Be Transparent",
      description: "Share your progress, challenges, and updates regularly. Backers appreciate honesty and transparency."
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Use Analytics",
      description: "Monitor your campaign performance and adjust your strategy based on real-time data and insights."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Engage Constantly",
      description: "Respond to comments, answer questions, and make backers feel like part of your journey."
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
                <Sparkles className="h-4 w-4 mr-2" />
                Complete Guide
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8">
                How Creator
                <span className="block bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Fundraising Works
                </span>
              </h1>
              
              <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                Your step-by-step guide to launching and running a successful fundraising campaign. 
                Learn the strategies, tools, and best practices used by top creators.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg">
                  <Link to="/creator/dashboard">Start Your Campaign</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 font-semibold px-8 py-4 rounded-xl text-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Tutorial
                </Button>
                <Button 
                  asChild
                  variant="ghost" 
                  size="lg" 
                  className="text-gray-600 hover:text-orange-600 font-semibold px-8 py-4 rounded-xl text-lg"
                >
                  <Link to="/creator-fundraising" className="flex items-center">
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back to Overview
                  </Link>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 backdrop-blur-sm bg-white/50 rounded-2xl p-8 border border-orange-200">
                {quickStats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Steps Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                The Complete 6-Step Process
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Follow these detailed steps to plan, launch, and successfully complete your fundraising campaign.
              </p>
            </div>

            <div className="space-y-12 max-w-6xl mx-auto">
              {detailedSteps.map((step, index) => (
                <div key={index} className="relative">
                  {/* Timeline connector */}
                  {index < detailedSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-24 left-12 w-1 h-full bg-gradient-to-b from-orange-500/20 to-purple-600/20 -z-10"></div>
                  )}
                  
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Left Side - Step Info */}
                      <div className="lg:w-1/3 p-8 bg-gradient-to-br from-orange-50 to-purple-50 border-r border-orange-200">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0">
                            {step.number}
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{step.title}</h3>
                            <p className="text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                          <Clock className="h-4 w-4" />
                          <span>Estimated time: {step.estimatedTime}</span>
                        </div>

                        {/* Resources */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-700 mb-3">Resources</h4>
                          <div className="space-y-2">
                            {step.resources.map((resource, resIndex) => (
                              <div key={resIndex} className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 cursor-pointer">
                                {resource.icon}
                                <span>{resource.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-lg text-white">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4" />
                            <span className="font-semibold">Pro Tip</span>
                          </div>
                          <p className="text-sm text-white/90">{step.tips[0]}</p>
                        </div>
                      </div>

                      {/* Right Side - Details */}
                      <div className="lg:w-2/3 p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              Key Actions
                            </h4>
                            <ul className="space-y-3">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2 text-gray-600">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                              <TrendingUp className="h-5 w-5 text-purple-500" />
                              Best Practices
                            </h4>
                            <ul className="space-y-3">
                              {step.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-2 text-gray-600">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="py-20 bg-gradient-to-br from-orange-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Success Strategies
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Learn from successful creators and implement these proven strategies for your campaign.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {bestPractices.map((practice, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
                  <CardHeader className="text-center pb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {practice.icon}
                    </div>
                    <CardTitle className="text-lg mb-2">{practice.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center text-sm">{practice.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tools & Resources Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Campaign Toolkit
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Everything you need to create and manage a successful fundraising campaign.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl text-center">
                <CardHeader>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <CardTitle>Templates & Guides</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Ready-to-use templates for every stage of your campaign</p>
                  <Button variant="outline" className="w-full">
                    Download Resources
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl text-center">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Track performance and optimize your campaign in real-time</p>
                  <Button variant="outline" className="w-full">
                    View Demo
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl text-center">
                <CardHeader>
                  <Video className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <CardTitle>Video Tutorials</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Step-by-step video guides from successful creators</p>
                  <Button variant="outline" className="w-full">
                    Watch Tutorials
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-orange-500 to-purple-600">
          <div className="container mx-auto px-4">
            <div className="text-center text-white max-w-4xl mx-auto">
              <HeartHandshake className="h-16 w-16 mx-auto mb-6 text-white/90" />
              <h2 className="text-4xl font-bold mb-6">
                Ready to Start Your Fundraising Journey?
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                You have the knowledge, now take the action. Launch your campaign today and turn your creative vision into reality.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg">
                  <Link to="/creator/dashboard">Launch Your Campaign</Link>
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl text-lg"
                >
                  <Link to="/creator-fundraising">Back to Overview</Link>
                </Button>
              </div>
              <p className="text-white/70 mt-6 text-sm">
                Need help? Our creator success team is here to support you every step of the way.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default HowFundraisingWorksPage;
