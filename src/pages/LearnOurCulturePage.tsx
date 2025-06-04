
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
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const LearnOurCulturePage = () => {
  const coreValues = [
    {
      icon: Heart,
      title: "Passion for Learning",
      description: "We believe that curiosity and continuous learning drive innovation and personal growth.",
      color: "text-red-500"
    },
    {
      icon: Users,
      title: "Community First",
      description: "Our community is at the heart of everything we do. We create connections that last.",
      color: "text-blue-500"
    },
    {
      icon: Lightbulb,
      title: "Innovation & Creativity",
      description: "We encourage bold ideas and creative solutions to transform education.",
      color: "text-yellow-500"
    },
    {
      icon: Target,
      title: "Excellence in Execution",
      description: "We set high standards and deliver exceptional experiences for our users.",
      color: "text-green-500"
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "We're building a platform that democratizes education across all borders.",
      color: "text-purple-500"
    },
    {
      icon: Award,
      title: "Integrity & Trust",
      description: "We operate with transparency, honesty, and respect in all our interactions.",
      color: "text-orange-500"
    }
  ];

  const workLifeBalance = [
    {
      icon: Coffee,
      title: "Flexible Work Hours",
      description: "Work when you're most productive. We trust our team to deliver results."
    },
    {
      icon: Laptop,
      title: "Remote-First Culture",
      description: "Work from anywhere in the world. We've been remote since day one."
    },
    {
      icon: BookOpen,
      title: "Learning Budget",
      description: "Annual learning budget for courses, conferences, and skill development."
    },
    {
      icon: Zap,
      title: "Innovation Time",
      description: "20% time for personal projects and exploring new ideas."
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
    <div className="min-h-screen bg-gradient-to-br from-light-purple via-white to-light-purple">
      <Layout>
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-orange-500/10" />
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <Badge className="mb-6" variant="outline">
                Our Culture
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                Learn About Our Culture
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                Discover what makes SkillPulse a special place to work. We're more than a team - 
                we're a community of passionate educators, innovators, and dreamers.
              </p>
            </div>
            
            {/* Culture Image */}
            <div className="mt-16 relative">
              <img
                src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//study-group-african-people.jpg?w=1200&h=600&fit=crop"
                alt="Team collaboration and culture"
                className="rounded-2xl shadow-2xl mx-auto max-w-4xl w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Core Values</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                These values guide everything we do and help us create an environment where everyone can thrive.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreValues.map((value, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-purple-100">
                  <CardHeader>
                    <div className="mb-4">
                      <value.icon className={`h-8 w-8 ${value.color}`} />
                    </div>
                    <CardTitle className="text-purple-800">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Work-Life Balance Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Work-Life Balance</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We believe that great work comes from happy, healthy, and fulfilled team members.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {workLifeBalance.map((item, index) => (
                <Card key={index} className="text-center p-6 border-purple-100">
                  <item.icon className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Testimonials Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">What Our Team Says</h2>
              <p className="text-xl text-muted-foreground">
                Hear directly from our team members about their experience working at SkillPulse.
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

        {/* Benefits & Perks Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Benefits & Perks
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  We offer comprehensive benefits and perks designed to support your health, 
                  happiness, and professional growth.
                </p>
                <div className="space-y-4">
                  {perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-lg">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1556484687-30636164638b?w=600&h=400&fit=crop"
                  alt="Team working together"
                  className="rounded-lg shadow-xl w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-orange-500 text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl mb-8 opacity-90 leading-relaxed">
              To democratize education by creating a platform where anyone can learn from the best, 
              and where passionate educators can share their knowledge with the world. We believe 
              that education has the power to transform lives, communities, and society as a whole.
            </p>
            <blockquote className="text-2xl italic mb-8 opacity-90">
              "Education is the most powerful weapon which you can use to change the world."
            </blockquote>
            <p className="text-lg opacity-75">- Nelson Mandela</p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Join Our Culture?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              If our values resonate with you and you're excited about transforming education, 
              we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700" asChild>
                <Link to="/careers">
                  View Open Positions <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-purple-200 text-purple-600 hover:bg-purple-50">
                Contact Us
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
};

export default LearnOurCulturePage;
