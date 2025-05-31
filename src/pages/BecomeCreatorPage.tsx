
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { 
  BookOpen, 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Globe,
  CreditCard,
  Smartphone,
  TrendingUp,
  Award,
  Video,
  BarChart3
} from 'lucide-react';

const BecomeCreatorPage = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Create Courses",
      description: "Build comprehensive online courses with video lessons, quizzes, and downloadable resources."
    },
    {
      icon: Calendar,
      title: "Host Events",
      description: "Organize webinars, workshops, and live events with integrated booking and payment systems."
    },
    {
      icon: DollarSign,
      title: "Monetize Content",
      description: "Set your own prices and earn money from your expertise and knowledge."
    },
    {
      icon: Users,
      title: "Build Community",
      description: "Connect with students and build a loyal following around your content."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track your performance, earnings, and student engagement with detailed analytics."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Reach students worldwide with our international payment processing capabilities."
    }
  ];

  const paymentFeatures = [
    {
      icon: CreditCard,
      title: "Stripe Integration",
      description: "Accept credit cards and receive payouts through Stripe's secure platform."
    },
    {
      icon: Smartphone,
      title: "Mobile Money",
      description: "Accept mobile money payments across 19 African countries for maximum accessibility."
    },
    {
      icon: TrendingUp,
      title: "Instant Payouts",
      description: "Get paid quickly with automated payout systems and real-time earnings tracking."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Tech Educator",
      content: "SkillPulse has transformed how I share my knowledge. I've reached over 5,000 students worldwide!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616c90c9c56?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Michael Chen",
      role: "Business Coach",
      content: "The mobile money integration for African markets has been a game-changer for my business.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Amara Okafor",
      role: "Language Instructor",
      content: "I love how easy it is to create engaging courses and track my students' progress.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Sign Up",
      description: "Create your account and complete your profile to get started."
    },
    {
      step: "2",
      title: "Enable Creator Mode",
      description: "Click 'Enable Creator Mode' in your account settings to unlock creator features."
    },
    {
      step: "3",
      title: "Create Content",
      description: "Start building your first course or event using our intuitive creation tools."
    },
    {
      step: "4",
      title: "Start Earning",
      description: "Publish your content and start accepting payments from students worldwide."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-purple via-white to-light-purple">
      <Layout>
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-orange-500/10" />
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-6" variant="outline">
                Join 10,000+ Creators Worldwide
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
                Become a Creator on SkillPulse
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Transform your expertise into income. Create courses, host events, and build your audience 
                with payments across Africa and globally.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/account">
                    Start Creating Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link to="/auth">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="mt-16 relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=600&fit=crop" 
                alt="People learning and teaching online"
                className="rounded-2xl shadow-2xl mx-auto max-w-4xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Our platform provides all the tools you need to create, market, and monetize your expertise.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Features */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Global Payment Solutions</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Accept payments from anywhere in the world with our integrated payment systems.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {paymentFeatures.map((feature, index) => (
                <Card key={index} className="text-center border-0 shadow-lg">
                  <CardHeader>
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Badge variant="outline" className="text-lg px-6 py-2">
                Supporting 19 African Countries for Mobile Money Payouts
              </Badge>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in just four simple steps and begin earning from your expertise.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl font-bold text-white">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">What Creators Say</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of successful creators who are already earning with SkillPulse.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                        <CardDescription>{testimonial.role}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-16">Join a Thriving Community</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
                <div className="text-muted-foreground">Active Creators</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-500 mb-2">500K+</div>
                <div className="text-muted-foreground">Students Enrolled</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600 mb-2">$2M+</div>
                <div className="text-muted-foreground">Creator Earnings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">19</div>
                <div className="text-muted-foreground">African Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-orange-500">
          <div className="container mx-auto text-center">
            <div className="max-w-3xl mx-auto text-white">
              <h2 className="text-4xl font-bold mb-6">Ready to Start Your Creator Journey?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of creators who are already building their audience and earning money 
                with their expertise. Enable your creator dashboard today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
                  <Link to="/account">
                    Enable Creator Dashboard
                    <Award className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 text-white border-white hover:bg-white hover:text-purple-600" asChild>
                  <Link to="/auth">
                    Sign Up Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
};

export default BecomeCreatorPage;
