
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
  BarChart3,
  CheckCircle,
  Award,
  PlayCircle
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
      name: "Sarah Mwaba",
      role: "Tech Educator",
      content: "SkillPulse has transformed how I share my knowledge. I've reached over 5,000 students worldwide!",
      rating: 5,
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//16303.jpg?w=100&h=100&fit=crop&crop=face"
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

  const benefits = [
    "Competitive salary packages",
    "Flexible remote work options",
    "Professional development opportunities",
    "Health and wellness benefits",
    "Stock options and equity",
    "Unlimited learning budget"
  ];

  const openPositions = [
    {
      title: "Senior Software Engineer",
      department: "Engineering",
      location: "Remote / San Francisco",
      type: "Full-time"
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Remote / New York",
      type: "Full-time"
    },
    {
      title: "UX/UI Designer",
      department: "Design",
      location: "Remote / London",
      type: "Full-time"
    },
    {
      title: "Data Scientist",
      department: "Analytics",
      location: "Remote / Berlin",
      type: "Full-time"
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
                Join Our Mission
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Build the Future of Education
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Join a passionate team dedicated to democratizing education and empowering creators worldwide. 
                Help us build the next generation of learning platforms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                  View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-purple-200 text-purple-600 hover:bg-purple-50">
                  Learn About Our Culture
                </Button>
              </div>
            </div>
            {/* Hero Image */}
            <div className="mt-16 relative">
              <img
                src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//male-employee-getting-used-his-new-office-job-along-with-female-colleagues.jpg?w=1200&h=600&fit=crop"
                alt="Team collaboration"
                className="rounded-2xl shadow-2xl mx-auto max-w-4xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </section>

        {/* Why Join Us Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Why Join SkillPulse?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We're not just building a product - we're creating a movement that transforms how people learn and teach.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-purple-100">
                  <CardHeader>
                    <div className="mb-4">
                      <feature.icon className="h-8 w-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-purple-800">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Amazing Benefits & Perks
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  We believe in taking care of our team so they can do their best work and live their best lives.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-orange-50 border-purple-200">
                  <Award className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Recognition</h3>
                  <p className="text-sm text-muted-foreground">Performance bonuses and awards</p>
                </Card>
                <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
                  <Globe className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Global Impact</h3>
                  <p className="text-sm text-muted-foreground">Work that changes lives</p>
                </Card>
                <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-orange-50 border-purple-200">
                  <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Amazing Team</h3>
                  <p className="text-sm text-muted-foreground">Collaborate with the best</p>
                </Card>
                <Card className="p-6 text-center bg-gradient-to-br from-orange-50 to-purple-50 border-orange-200">
                  <TrendingUp className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Growth</h3>
                  <p className="text-sm text-muted-foreground">Continuous learning opportunities</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Open Positions Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Open Positions</h2>
              <p className="text-xl text-muted-foreground">
                Find your next career opportunity and help us build the future of education.
              </p>
            </div>
            <div className="space-y-4">
              {openPositions.map((position, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-purple-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="mb-4 md:mb-0">
                      <h3 className="text-xl font-semibold mb-2 text-purple-800">{position.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="border-purple-200 text-purple-600">
                          {position.department}
                        </Badge>
                        <Badge variant="outline" className="border-orange-200 text-orange-600">
                          {position.location}
                        </Badge>
                        <Badge variant="outline" className="border-green-200 text-green-600">
                          {position.type}
                        </Badge>
                      </div>
                    </div>
                    <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                      Apply Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Testimonials Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">What Our Team Says</h2>
              <p className="text-xl text-muted-foreground">
                Hear from our team members about their experience working at SkillPulse.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6 border-purple-100">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <img 
                        src={testimonial.image} 
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
        <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Join Our Mission?</h2>
            <p className="text-xl mb-8 opacity-90">
              Be part of a team that's transforming education and empowering creators worldwide. 
              Your next career adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Browse All Positions
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-purple-600">
                Contact HR Team
              </Button>
            </div>
            <div className="mt-8 text-sm opacity-75">
              Equal opportunity employer • Remote-first culture • Diverse and inclusive team
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
};

export default CareersPage;
