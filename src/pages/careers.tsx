import React, { useState, useEffect } from 'react';
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
  PlayCircle,
  Heart,
  Zap,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  created_at: string;
}

const CareersPage = () => {
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobOpenings();
  }, []);

  const fetchJobOpenings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_openings')
        .select('id, title, department, location, employment_type, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobOpenings(data || []);
    } catch (error) {
      console.error('Error fetching job openings:', error);
      toast.error('Failed to load job openings');
    } finally {
      setLoading(false);
    }
  };

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
      name: "Sarah ",
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

  const benefits = [
    "Competitive salary packages",
    "Flexible remote work options",
    "Professional development opportunities",
    "Health and wellness benefits",
    "Stock options and equity",
    "Unlimited learning budget"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <Layout>
        {/* Enhanced Hero Section with Background Image and Overlay */}
        <section className="relative py-32 px-4 overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//male-employee-getting-used-his-new-office-job-along-with-female-colleagues.jpg?w=1200&h=800&fit=crop')`
            }}
          />
          {/* Orange-Purple Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 via-purple-600/70 to-orange-500/80" />
          
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          
          {/* Content Container */}
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-6 px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 shadow-lg">
                🚀 Join Our Mission
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
                Build the Future of Education
              </h1>
              <p className="text-xl md:text-2xl text-white/95 mb-10 leading-relaxed font-light drop-shadow-lg">
                Join a passionate team dedicated to democratizing education and empowering creators worldwide. 
                Help us build the next generation of learning platforms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-slate-800 hover:bg-slate-100 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 border-0 font-semibold" asChild>
                  <a href="#open-positions">
                    View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300 backdrop-blur-sm" asChild>
                  <Link to="/learn-our-culture">
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Learn About Our Culture
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Stats Cards Floating Over Hero */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-orange-300" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">50+</div>
                    <div className="text-sm opacity-90">Open Positions</div>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <Globe className="h-8 w-8 text-purple-300" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">Remote</div>
                    <div className="text-sm opacity-90">First Culture</div>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-white/20 backdrop-blur-sm border-white/30 text-white p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-orange-300" />
                  <div className="text-left">
                    <div className="text-2xl font-bold">Global</div>
                    <div className="text-sm opacity-90">Team Members</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Join Us Section */}
        <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Why Join SkillPulse?
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                We're not just building a product - we're creating a movement that transforms how people learn and teach.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-2xl transition-all duration-500 border-slate-100 hover:border-orange-200/50 hover:scale-105 cursor-pointer bg-white/90 backdrop-blur-sm shadow-lg"
                >
                  <CardHeader className="pb-4">
                    <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-md">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-slate-600 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Benefits Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-50/50 to-purple-50/50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Amazing Benefits & Perks
                </h2>
                <p className="text-xl text-slate-600 mb-10 font-light leading-relaxed">
                  We believe in taking care of our team so they can do their best work and live their best lives.
                </p>
                <div className="space-y-5">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-md">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg text-slate-700 group-hover:text-slate-900 transition-colors duration-300 font-medium">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border-orange-100 group hover:shadow-xl transition-all duration-500 shadow-lg">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 text-lg">Recognition</h3>
                  <p className="text-sm text-slate-600">Performance bonuses and awards</p>
                </Card>
                
                <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border-purple-100 group hover:shadow-xl transition-all duration-500 shadow-lg">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 text-lg">Global Impact</h3>
                  <p className="text-sm text-slate-600">Work that changes lives</p>
                </Card>
                
                <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border-orange-100 group hover:shadow-xl transition-all duration-500 shadow-lg">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 text-lg">Amazing Team</h3>
                  <p className="text-sm text-slate-600">Collaborate with the best</p>
                </Card>
                
                <Card className="p-6 text-center bg-white/90 backdrop-blur-sm border-purple-100 group hover:shadow-xl transition-all duration-500 shadow-lg">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-2 text-lg">Fast Growth</h3>
                  <p className="text-sm text-slate-600">Rapid career advancement</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Open Positions Section */}
        <section id="open-positions" className="py-20 px-4 bg-white/90 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Open Positions
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                Find your next career opportunity and help us build the future of education.
              </p>
            </div>
            
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-slate-600 font-medium">Loading amazing opportunities...</p>
              </div>
            ) : jobOpenings.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-3xl border border-slate-100 shadow-lg">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">No Open Positions Right Now</h3>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  We're always looking for amazing talent! Check back soon or send us your resume for future opportunities.
                </p>
                <Button className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-lg hover:shadow-xl">
                  <a href="mailto:jobs@skillpulse.cloud">Send Your Resume</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {jobOpenings.map((position) => (
                  <Card 
                    key={position.id} 
                    className="p-8 hover:shadow-2xl transition-all duration-500 border-slate-100 group hover:border-orange-200 cursor-pointer bg-white/90 backdrop-blur-sm shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="mb-6 md:mb-0 md:flex-1">
                        <h3 className="text-2xl font-bold mb-3 text-slate-800 group-hover:text-orange-600 transition-colors duration-300">
                          {position.title}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <Badge className="px-3 py-1.5 bg-orange-500/10 text-orange-600 border-orange-200 group-hover:bg-orange-500/20 transition-colors duration-300 shadow-sm">
                            {position.department}
                          </Badge>
                          <Badge className="px-3 py-1.5 bg-purple-500/10 text-purple-600 border-purple-200 group-hover:bg-purple-500/20 transition-colors duration-300 shadow-sm">
                            {position.location}
                          </Badge>
                          <Badge className="px-3 py-1.5 bg-green-500/10 text-green-600 border-green-200 group-hover:bg-green-500/20 transition-colors duration-300 shadow-sm">
                            {position.employment_type}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform group-hover:scale-105 transition-all duration-300 px-8 py-6 text-lg border-0" 
                        asChild
                      >
                        <Link to={`/job/${position.id}`}>
                          Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Enhanced Team Testimonials Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-slate-50 to-purple-50/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                What Our Team Says
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                Hear from our team members about their experience working at SkillPulse.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="p-8 border-slate-100 bg-white/90 backdrop-blur-sm group hover:shadow-2xl transition-all duration-500 hover:scale-105 shadow-lg"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-8 text-lg leading-relaxed italic font-light">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-4">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg group-hover:border-orange-200 transition-colors duration-300"
                      />
                      <div>
                        <div className="font-bold text-slate-800 text-lg">{testimonial.name}</div>
                        <div className="text-slate-600 font-medium">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-size-200 animate-gradient text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8 drop-shadow-lg">
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl md:text-2xl mb-12 opacity-95 font-light leading-relaxed drop-shadow-md">
              Be part of a team that's transforming education and empowering creators worldwide. 
              Your next career adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-10 py-7 bg-white text-slate-800 hover:bg-slate-100 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 font-semibold border-0"
                asChild
              >
                <a href="#open-positions">
                  Browse All Positions <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300 font-semibold"
              >
                <a href="mailto:jobs@skillpulse.cloud" className="flex items-center">
                  Contact HR Team
                </a>
              </Button>
            </div>
            <div className="mt-12 text-lg opacity-90 font-medium flex flex-col sm:flex-row justify-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                Equal opportunity employer
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                Remote-first culture
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-300" />
                Diverse and inclusive team
              </div>
            </div>
          </div>
        </section>
      </Layout>
      
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
        .bg-size-200 {
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
};

export default CareersPage;
