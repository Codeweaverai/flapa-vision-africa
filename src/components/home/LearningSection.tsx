
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Award, Globe, ArrowRight, Play, Calendar, MessageCircle } from 'lucide-react';

const LearningSection = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Expert-Led Courses",
      description: "Learn from industry professionals with real-world experience and proven track records.",
      color: "bg-blue-500"
    },
    {
      icon: Users,
      title: "Community Learning",
      description: "Connect with fellow learners, share insights, and grow together in our vibrant community.",
      color: "bg-green-500"
    },
    {
      icon: Calendar,
      title: "Live Events",
      description: "Attend interactive workshops, webinars, and masterclasses with leading experts.",
      color: "bg-purple-500"
    },
    {
      icon: Award,
      title: "Certificates",
      description: "Earn recognized certificates upon completion to showcase your new skills.",
      color: "bg-orange-500"
    },
    {
      icon: MessageCircle,
      title: "1-on-1 Consultations",
      description: "Get personalized guidance and mentorship from industry experts.",
      color: "bg-pink-500"
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Learn from anywhere, anytime with our mobile-friendly platform.",
      color: "bg-indigo-500"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Learners", icon: Users },
    { number: "500+", label: "Expert Instructors", icon: Award },
    { number: "1,000+", label: "Courses Available", icon: BookOpen },
    { number: "50+", label: "Countries Reached", icon: Globe }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-orange-500 to-purple-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-white/20 text-white border-white/30" variant="outline">
            Skills Marketplace Platform
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Everything You Need to
            <span className="block bg-gradient-to-r from-orange-200 to-purple-200 bg-clip-text text-transparent">
              Master New Skills
            </span>
          </h2>
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Our comprehensive platform combines the best of online learning, live events, 
            community interaction, and personalized mentorship to accelerate your growth.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-white/20 rounded-full p-3">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/80">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have already started their learning journey with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/explore/courses">
              <Button size="lg" className="text-lg px-8 py-6 bg-white text-orange-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200">
                <Play className="mr-2 h-5 w-5" />
                Start Learning Today
              </Button>
            </Link>
            <Link to="/become-creator">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-orange-600 transform hover:scale-105 transition-all duration-200">
                Become an Instructor
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningSection;
