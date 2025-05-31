
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Globe, 
  Star,
  CheckCircle,
  PlayCircle,
  Award,
  Smartphone,
  CreditCard
} from 'lucide-react';

const BecomeCreatorPage = () => {
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Create Courses",
      description: "Build comprehensive online courses with videos, quizzes, and materials"
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Host Events",
      description: "Organize webinars, workshops, and live events for your audience"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Monetize Content",
      description: "Set your own prices and earn from your expertise and knowledge"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Build Community",
      description: "Connect with students and build a loyal following"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Track Analytics",
      description: "Monitor your performance with detailed insights and metrics"
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Global Reach",
      description: "Reach students worldwide with our international platform"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Digital Marketing Expert",
      content: "SkillPulse has transformed my teaching career. I've reached over 10,000 students and built a sustainable income stream.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "David Chen",
      role: "Programming Instructor",
      content: "The platform's tools make it easy to create engaging content. My course completion rates have increased by 40%.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Maria Rodriguez",
      role: "Business Coach",
      content: "The payment system is seamless. I love how I can accept payments from students across Africa using mobile money.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Enable Creator Mode",
      description: "Click 'Enable Creator Mode' in your account settings to get started"
    },
    {
      step: "2",
      title: "Create Your Content",
      description: "Upload courses, schedule events, and build your curriculum"
    },
    {
      step: "3",
      title: "Set Your Prices",
      description: "Choose your pricing strategy and set up payment methods"
    },
    {
      step: "4",
      title: "Launch & Earn",
      description: "Publish your content and start earning from your expertise"
    }
  ];

  const paymentMethods = [
    "Stripe for global payments",
    "Mobile Money across 19 African countries",
    "Bank transfers and digital wallets",
    "Cryptocurrency payments (coming soon)"
  ];

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4" variant="secondary">
                  💡 Become a Creator
                </Badge>
                <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple to-orange-600 bg-clip-text text-transparent">
                  Share Your Knowledge, Build Your Empire
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Join thousands of creators who are monetizing their expertise through courses and events. 
                  Reach a global audience and build a sustainable income doing what you love.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-lg px-8 py-6" asChild>
                    <Link to="/account">Start Creating Today</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>
              
                {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl aspect-video">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/IJh6KbJznx8?autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-2 right-2 text-white text-2xl"
            >
              &times;
            </button>
          </div>
           </div>
                <div className="mt-8 flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-muted-foreground">Active Creators</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">500K+</div>
                    <div className="text-sm text-muted-foreground">Students Enrolled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">$2M+</div>
                    <div className="text-sm text-muted-foreground">Creator Earnings</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//pexels-olly-3769021.jpg?w=600&h=400&fit=crop" 
                  alt="Creator working on content"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="font-semibold">Top Creator</div>
                      <div className="text-sm text-muted-foreground">$15,000/month</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our platform provides all the tools and features you need to create, market, and monetize your content.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mb-4">{feature.icon}</div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Methods Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Get Paid Your Way
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  We support multiple payment methods to ensure you can receive payments from students worldwide, 
                  especially across Africa where mobile money is king.
                </p>
                <div className="space-y-4">
                  {paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg">{method}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="h-6 w-6 text-green-600" />
                    <h3 className="font-semibold text-green-800">Mobile Money Coverage</h3>
                  </div>
                  <p className="text-green-700">
                    Reach students across 19 African countries with mobile money payments including MTN, Airtel, 
                    Orange, and more. No barriers, just pure accessibility.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center">
                  <CreditCard className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Stripe Integration</h3>
                  <p className="text-sm text-muted-foreground">Global payments, instant transfers</p>
                </Card>
                <Card className="p-6 text-center">
                  <Smartphone className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Mobile Money</h3>
                  <p className="text-sm text-muted-foreground">African mobile payments</p>
                </Card>
                <Card className="p-6 text-center">
                  <DollarSign className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Low Fees</h3>
                  <p className="text-sm text-muted-foreground">Keep more of what you earn</p>
                </Card>
                <Card className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Real-time Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track your earnings</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground">
                Getting started as a creator is simple. Follow these steps to begin your journey.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">What Our Creators Say</h2>
              <p className="text-xl text-muted-foreground">
                Hear from successful creators who have built thriving businesses on our platform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-primary to-purple-600 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Your Creator Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators who are already building successful businesses. 
              Enable your creator dashboard today and start monetizing your expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
                <Link to="/account">Enable Creator Mode</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-primary">
                Learn More
              </Button>
            </div>
            <div className="mt-8 text-sm opacity-75">
              No setup fees • Start earning immediately • 24/7 support
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
};

export default BecomeCreatorPage;
