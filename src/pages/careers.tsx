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
  Globe,
  CreditCard,
  Smartphone,
  TrendingUp,
  BarChart3
} from 'lucide-react';

const CareersPage = () => {
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
                Transform your expertise into income. Create courses, host events, and build your audience with payments across Africa and globally.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/account">
                    Start Creating Today <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link to="/auth">Learn More</Link>
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

        {/* The rest of your sections go here... */}
      </Layout>
    </div>
  );
};

export default BecomeCreatorPage;

