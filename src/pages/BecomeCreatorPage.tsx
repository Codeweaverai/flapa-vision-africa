
import React, { useState } from 'react';
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
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import YouTubeModal from '@/components/video/YouTubeModal';

const BecomeCreatorPage = () => {
  const [showDemoVideo, setShowDemoVideo] = useState(false);
  const demoVideoUrl = "https://youtu.be/bJCb8e-Z-u8?si=wYigVFkbEhKy7w5D"; // Replace with actual demo video URL

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

        {/* Success Stories Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Creator Success Stories
              </h2>
              <p className="text-xl text-gray-700">
                See how our creators are making an impact and earning revenue.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((_, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-200 to-purple-200 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-orange-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                        <CardDescription>Web Development Instructor</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      "SkillPulse has allowed me to reach over 5,000 students and earn a full-time income 
                      teaching what I love. The platform makes it so easy to create and manage courses."
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        5,000+ students
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        $50K+ earned
                      </span>
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
                    <Link to="/auth"> Enable Your Creator Dashboard - It's Free</Link>
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

        {/* YouTube Demo Modal */}
        <YouTubeModal
          isOpen={showDemoVideo}
          onClose={() => setShowDemoVideo(false)}
          videoUrl={demoVideoUrl}
          title="SkillPulse Creator Program Demo"
        />
      </div>
    </Layout>
  );
};

export default BecomeCreatorPage;
