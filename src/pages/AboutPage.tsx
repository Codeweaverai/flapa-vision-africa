import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Award, Globe, Zap, Heart, Target, CheckCircle, ArrowRight, Linkedin, Twitter, Mail } from 'lucide-react';

const AboutPage = () => {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We believe in the power of community and collaboration to drive learning and growth."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from course quality to user experience."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Making quality education accessible to learners worldwide, regardless of location or background."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Continuously innovating to improve the learning experience through technology."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Learners" },
    { number: "500+", label: "Expert Instructors" },
    { number: "1,000+", label: "Courses Available" },
    { number: "50+", label: "Countries Reached" }
  ];

  const features = [
    "Interactive video learning",
    "Real-time discussions",
    "Mobile-friendly platform",
    "Certificate programs",
    "Progress tracking",
    "Community support"
  ];

  const teamMembers = [
    {
      name: "Mbolela Pule",
      role: "CEO & Founder",
      bio: "Passionate about democratizing education through technology. 10+ years in EdTech.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//profile.jpeg?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "mbolela.pule@skillpulse.cloud"
    },
    {
      name: "George Munganga",
      role: "CTO",
      bio: "Full-stack developer with expertise in scalable learning platforms and AI integration.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//1675545655734.jpg?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "george@skillpulse.cloud"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Content",
      bio: "Former university professor specializing in curriculum development and instructional design.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "emily@skillpulse.cloud"
    },
    {
      name: "David Kim",
      role: "Lead Designer",
      bio: "UX/UI designer focused on creating intuitive and accessible learning experiences.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "david@skillpulse.cloud"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <Badge className="mb-6" variant="outline">
              Our Story
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">SkillPulse</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              We're on a mission to democratize education and empower creators worldwide. 
              Our platform connects passionate instructors with eager learners, fostering 
              a global community of knowledge sharing and growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-purple-200 text-purple-600 hover:bg-purple-50">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold mb-6">
                  Our Mission
                </h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  At SkillPulse, we believe that education should be accessible, engaging, and 
                  transformative. We're building a platform where knowledge flows freely, 
                  creators are empowered, and learners can achieve their dreams.
                </p>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-lg">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//study-group-african-people.jpg?w=600&h=400&fit=crop"
                  alt="Learning together"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-orange-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
                  <Heart className="h-8 w-8 mb-2" />
                  <div className="font-bold">Passionate</div>
                  <div className="text-sm opacity-90">Learning Community</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Our Values</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                These core values guide everything we do and shape the culture of our platform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow border-purple-100">
                  <CardHeader>
                    <div className="mb-4">
                      <value.icon className="h-12 w-12 mx-auto text-purple-600" />
                    </div>
                    <CardTitle className="text-purple-800">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{value.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Meet Our Team Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                The passionate individuals behind SkillPulse, working tirelessly to transform education through technology.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow border-purple-100">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                      />
                      <h3 className="text-xl font-bold text-purple-800">{member.name}</h3>
                      <p className="text-orange-600 font-medium">{member.role}</p>
                    </div>
                    <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                    <div className="flex justify-center gap-3">
                      <Button variant="outline" size="sm" className="p-2">
                        <Linkedin className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="p-2">
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="p-2">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-r from-purple-600 to-orange-500 text-white">
              <CardContent className="p-12 text-center">
                <Target className="h-16 w-16 mx-auto mb-6 opacity-90" />
                <h2 className="text-4xl font-bold mb-6">Our Vision</h2>
                <p className="text-xl leading-relaxed mb-8 opacity-90">
                  To create a world where anyone, anywhere, can learn anything they want and 
                  share their knowledge with others. We envision a future where geographical 
                  boundaries don't limit educational opportunities, and where every person 
                  has the tools to become both a learner and a teacher.
                </p>
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Join Our Mission
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-white/50">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Start Learning?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of learners who are already transforming their lives through education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                Start Learning Today
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-purple-200 text-purple-600 hover:bg-purple-50">
                Become an Instructor
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AboutPage;
