import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Users, 
  DollarSign, 
  BookOpen, 
  Play, 
  CheckCircle, 
  TrendingUp,
  Globe,
  Shield,
  Heart,
  Bot,
  Zap,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import YouTubeModal from '@/components/video/YouTubeModal';
import { supabase } from '@/integrations/supabase/client';
import CreatorsSection from '@/components/home/CreatorsSection';

const BecomeCreatorPage = () => {
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const [creators, setCreators] = useState([]);
  const demoVideoUrl = "https://youtu.be/B8ay-17oP_0?si=4qFRvqzRSLq_gfTH";

  const benefits = [
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Earn Revenue",
      description: "Set your own prices and earn up to 92% revenue share from course sales and events."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Global Reach",
      description: "Access thousands of learners worldwide and build your personal brand."
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Course Creation Tools",
      description: "Use our intuitive course builder with video hosting, quizzes,exercises and assessments."
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Analytics & Insights",
      description: "Track your performance with detailed analytics and student feedback."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Marketing Support",
      description: "Get featured on our platform and receive marketing support to grow your audience."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Reliable payment processing with automatic payouts and fraud protection."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Create an account,login upload your profile photo and enter your short Bio."
    },
    {
      number: "02",
      title: "Enable Your Creator Dashboard",
      description: "In your account you will see a Button called Enable Creator Dashboard, click on it and a Go to Creator Dashboard button will appear."
    },
    {
      number: "03",
      title: "Create Your Content",
      description: "Use your dashboard to create engaging courses and events."
    },
    {
      number: "04",
      title: "Launch & Earn",
      description: "Publish your content and start earning from day one."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Learners" },
    { number: "500+", label: "Creators" },
    { number: "$2M+", label: "Creator Earnings" },
    { number: "95%", label: "Creator Satisfaction" }
  ];

  useEffect(() => {
    const fetchCreators = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('is_creator', true)
        .not('full_name', 'is', null)
        .limit(3);
      
      if (data && data.length > 0) {
        const creatorsWithEarnings = data
          .filter(creator => creator && creator.id) // Filter out any null/undefined creators
          .map((creator, index) => ({
            id: creator.id,
            full_name: creator.full_name,
            profile_picture: creator.avatar_url,
            bio: creator.bio,
            earnings: [45000, 32000, 28000][index] || 15000,
            students: [2500, 1800, 1200][index] || 500,
            courses: [12, 8, 6][index] || 3,
            rating: [4.9, 4.8, 4.7][index] || 4.5
          }));
        setCreators(creatorsWithEarnings);
      }
    };

    fetchCreators();
  }, []);

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
                Creator Program
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-8">
                Share Your Knowledge,
                <span className="block bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Earn Money
                </span>
              </h1>
              
              <p className="text-xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join thousands of creators who are transforming lives through Skills Training and Events managemnt while building 
                sustainable income streams with SkillPulse Marketplace. Create courses, host events, and grow your impact.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg">
                  <Link to="/auth">Start Creating Today</Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setShowDemoVideo(true)}
                  className="border-2 border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 font-semibold px-8 py-4 rounded-xl text-lg"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Why Choose SkillPulse?
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                We provide everything you need to succeed as an online educator and content creator.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardHeader className="text-center pb-4">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      {benefit.icon}
                    </div>
                    <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Getting started as a creator is simple. Follow these four easy steps.
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

        {/* AI Creator Tools Section */}
        <section className="py-20 bg-gradient-to-br from-orange-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-6 py-2 text-lg">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Creation
              </Badge>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Creator AI Tools
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Supercharge your content creation with our multi-agentic AI systems that simplify 
                event and course creation with just one click.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* AI Event Creator Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-600/5 group-hover:from-orange-500/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
                <CardHeader className="text-center pb-4 relative z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl mb-2">AI Event Creator</CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Multi-agentic system that builds complete, production-ready events
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Intelligent Agent Coordination</h4>
                        <p className="text-gray-600 text-sm">Manager Agent coordinates specialized AI agents for optimal results</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Real Speaker Research</h4>
                        <p className="text-gray-600 text-sm">Researches and profiles specific speakers based on your inputs</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Complete Event Structure</h4>
                        <p className="text-gray-600 text-sm">Generates detailed agenda, tickets, and marketing materials</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Smart Pricing</h4>
                        <p className="text-gray-600 text-sm">Automatically sets affordable ticket prices ($3-$40 range)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-orange-500" />
                      Productivity Boost
                    </h5>
                    <p className="text-sm text-gray-600">
                      Save 10+ hours per event with automated research, planning, and content creation
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Course Creator Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-600/5 group-hover:from-orange-500/10 group-hover:to-purple-600/10 transition-all duration-300"></div>
                <CardHeader className="text-center pb-4 relative z-10">
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl mb-2">AI Course Creator</CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Comprehensive course generation with quizzes, exams, and transcripts
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Complete Content Generation</h4>
                        <p className="text-gray-600 text-sm">Creates modules, lessons, video scripts, and assessments</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Automated Assessments</h4>
                        <p className="text-gray-600 text-sm">Generates 3 quizzes per module + 15 final exam questions</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Video Transcripts</h4>
                        <p className="text-gray-600 text-sm">Automatically creates detailed transcripts for all video content</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-1 rounded-full mt-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Optimized Structure</h4>
                        <p className="text-gray-600 text-sm">Intelligently organizes content for maximum student engagement</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-purple-200">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-purple-500" />
                      Productivity Boost
                    </h5>
                    <p className="text-sm text-gray-600">
                      Save 20+ hours per course with automated content creation and assessment generation
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* How AI Tools Work Section */}
            <div className="mt-16 text-center">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto border border-orange-200 shadow-lg">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  How Our AI Tools Boost Your Productivity
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                      <Clock className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Save Time</h4>
                    <p className="text-gray-600 text-sm">Reduce content creation time by 80% with automated generation</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Enhance Quality</h4>
                    <p className="text-gray-600 text-sm">Professional-grade content with consistent structure and depth</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 w-12 h-12 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                      <Users className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">Scale Faster</h4>
                    <p className="text-gray-600 text-sm">Launch multiple courses and events simultaneously</p>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Button asChild className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg">
                    <Link to="/auth">Access AI Tools in Dashboard</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Creators Section */}
        <CreatorsSection />

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-2xl max-w-4xl mx-auto overflow-hidden">
              <CardContent className="p-12 text-center text-white">
                <div className="mb-6">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-white/90" />
                </div>
                <h3 className="text-4xl font-bold mb-6">
                  Ready to Start Your Creator Journey?
                </h3>
                <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                  Join our community of passionate educators and start making an impact today. 
                  Your expertise can change lives while building your dream career.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg">
                    <Link to="/auth"> Enable Creator Dashboard </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setShowDemoVideo(true)}
                    className="border-2 border-white text-orange-600 hover:bg-white/10 font-semibold px-8 py-4 rounded-xl text-lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Watch Success Stories
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* YouTube Demo Modal with increased height */}
        <YouTubeModal
          isOpen={showDemoVideo}
          onClose={() => setShowDemoVideo(false)}
          videoUrl={demoVideoUrl}
          title="SkillPulse Creator Program Demo"
          className="max-w-4xl"
          videoClassName="aspect-[16/10]" // Increased height ratio
        />
      </div>
    </Layout>
  );
};

export default BecomeCreatorPage;
