import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Users, 
  Lightbulb, 
  Target, 
  Globe, 
  Award,
  Coffee,
  Laptop,
  BookOpen,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  TargetIcon,
  GraduationCap,
  Rocket
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LearnOurCulturePage = () => {
  const coreValues = [
    {
      icon: Heart,
      title: "Passion for Learning",
      description: "We believe that curiosity and continuous learning drive innovation and personal growth.",
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: Users,
      title: "Community First",
      description: "Our community is at the heart of everything we do. We create connections that last.",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: Lightbulb,
      title: "Innovation & Creativity",
      description: "We encourage bold ideas and creative solutions to transform education.",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Target,
      title: "Excellence in Execution",
      description: "We set high standards and deliver exceptional experiences for our users.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "We're building a platform that democratizes education across all borders.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Award,
      title: "Integrity & Trust",
      description: "We operate with transparency, honesty, and respect in all our interactions.",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const workLifeBalance = [
    {
      icon: Coffee,
      title: "Flexible Work Hours",
      description: "Work when you're most productive. We trust our team to deliver results.",
      color: "bg-orange-500"
    },
    {
      icon: Laptop,
      title: "Remote-First Culture",
      description: "Work from anywhere in the world. We've been remote since day one.",
      color: "bg-purple-500"
    },
    {
      icon: BookOpen,
      title: "Learning Budget",
      description: "Annual learning budget for courses, conferences, and skill development.",
      color: "bg-orange-500"
    },
    {
      icon: Zap,
      title: "Innovation Time",
      description: "20% time for personal projects and exploring new ideas.",
      color: "bg-purple-500"
    }
  ];

  const testimonials = [
    {
      name: "Alex Thompson",
      role: "Senior Developer",
      content: "The culture here is incredible. I've never felt more supported to grow and take on new challenges.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Maria Rodriguez",
      role: "Product Designer",
      content: "Working at SkillPulse has been transformative. The team truly cares about making education accessible.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "David Kim",
      role: "Data Scientist",
      content: "The learning opportunities here are endless. I've grown more in 6 months than in years elsewhere.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const perks = [
    "Competitive salaries with equity options",
    "Comprehensive health, dental, and vision insurance",
    "Unlimited PTO policy",
    "Home office setup budget",
    "Annual company retreats",
    "Mental health and wellness support",
    "Parental leave benefits",
    "Professional development stipend"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-purple-50/30">
      <Layout>
        {/* Enhanced Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-600/5 to-transparent" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-orange-300/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-400/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              <Badge className="mb-6 px-4 py-1.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 shadow-lg">
                <Sparkles className="h-3 w-3 mr-1" />
                Our Culture & Values
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-clip-text text-transparent bg-size-200 animate-gradient">
                Where Passion Meets Purpose
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed font-light max-w-3xl mx-auto">
                Discover what makes SkillPulse a special place to work. We're more than a team - 
                we're a community of passionate educators, innovators, and dreamers building the future of learning.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300" 
                  asChild
                >
                  <Link to="/careers">
                    Join Our Team <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 backdrop-blur-sm"
                >
                  Meet Our Team
                </Button>
              </div>
            </div>
            
            {/* Enhanced Culture Image */}
            <div className="mt-20 relative max-w-6xl mx-auto">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//study-group-african-people.jpg?w=1200&h=600&fit=crop"
                  alt="Team collaboration and culture"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Inspiring Workplace Culture</span>
                  </div>
                  <h3 className="text-2xl font-bold">Building Together, Growing Together</h3>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 bg-white rounded-2xl p-4 shadow-xl border border-orange-100">
                <div className="flex items-center gap-2">
                  <TargetIcon className="h-5 w-5 text-orange-500" />
                  <span className="font-semibold text-sm">Mission Driven</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-purple-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold text-sm">Always Learning</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Core Values Section */}
        <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Our Core Values
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                These values guide everything we do and help us create an environment where everyone can thrive.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreValues.map((value, index) => (
                <Card 
                  key={index} 
                  className="group hover:shadow-2xl transition-all duration-500 border-slate-100 hover:border-orange-200/50 hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-slate-50/50"
                >
                  <CardHeader className="pb-4">
                    <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-lg`}>
                        <value.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-slate-800 group-hover:text-orange-600 transition-colors duration-300 text-xl">
                      {value.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed font-light">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Work-Life Balance Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-50/50 to-purple-50/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Work-Life Harmony
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                We believe that great work comes from happy, healthy, and fulfilled team members.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workLifeBalance.map((item, index) => (
                <Card 
                  key={index} 
                  className="text-center p-8 border-slate-100 bg-white/70 backdrop-blur-sm group hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 mb-3 text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed font-light">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Team Testimonials Section */}
        <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Voices From Our Team
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">
                Hear directly from our team members about their experience working at SkillPulse.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="p-8 border-slate-100 bg-gradient-to-br from-white to-slate-50/50 group hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-8 text-lg leading-relaxed italic font-light">"{testimonial.content}"</p>
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

        {/* Enhanced Benefits & Perks Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-orange-50/50 to-purple-50/50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Benefits & Perks
                </h2>
                <p className="text-xl text-slate-600 mb-10 font-light leading-relaxed">
                  We offer comprehensive benefits and perks designed to support your health, 
                  happiness, and professional growth.
                </p>
                <div className="space-y-5">
                  {perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-lg text-slate-700 group-hover:text-slate-900 transition-colors duration-300 font-medium">
                        {perk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1556484687-30636164638b?w=600&h=400&fit=crop"
                    alt="Team working together"
                    className="w-full h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-2xl border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">Fast Growth</div>
                      <div className="text-sm text-slate-600">Accelerate your career</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Mission Statement Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-size-200 animate-gradient text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
          
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 border border-white/20">
              <Target className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">Our Mission</h2>
            <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed font-light">
              To democratize education by creating a platform where anyone can learn from the best, 
              and where passionate educators can share their knowledge with the world.
            </p>
            <blockquote className="text-2xl md:text-3xl italic mb-10 opacity-95 font-light leading-relaxed">
              "Education is the most powerful weapon which you can use to change the world."
            </blockquote>
            <p className="text-lg opacity-90 font-medium">- Nelson Mandela</p>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-20 px-4 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Ready to Join Our Culture?
            </h2>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              If our values resonate with you and you're excited about transforming education, 
              we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 font-semibold" 
                asChild
              >
                <Link to="/careers">
                  View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 border-2 border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Contact Our Team
              </Button>
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

export default LearnOurCulturePage;
