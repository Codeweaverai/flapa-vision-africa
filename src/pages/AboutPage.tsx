
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, Award, Heart, Lightbulb, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  const values = [
    {
      icon: Target,
      title: "Mission-Driven",
      description: "We're committed to bridging the gap between expertise and opportunity, driving professional growth across Africa."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We leverage cutting-edge technology to create accessible learning experiences for everyone."
    },
    {
      icon: Heart,
      title: "Community-Focused",
      description: "Building strong communities where knowledge sharing and collaboration thrive."
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Creating sustainable learning pathways that reach millions across the continent."
    }
  ];

  const team = [
    {
      name: "Mbolela Pule",
      role: "Founder & CEO",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      description: "Technology leader and entrepreneur passionate about African development."
    },
    {
      name: "Sarah Johnson",
      role: "Head of Learning",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=400&q=80",
      description: "Educational expert with 15+ years in curriculum development."
    },
    {
      name: "David Kimani",
      role: "Technical Director",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      description: "Full-stack developer building scalable learning platforms."
    }
  ];

  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6">About SkillPulse</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're transforming how people learn and grow professionally across Africa through 
              innovative technology and community-driven education.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg mb-4">
                SkillPulse is a pioneering skills and event booking platform transforming how people 
                learn and grow professionally. With a unique blend of technical innovation and 
                educational expertise, we've built SkillPulse to harness collective knowledge 
                for professional advancement.
              </p>
              <p className="text-lg mb-6">
                Our mission is to bridge the gap between expertise and opportunity, driving 
                professional growth, and fostering community development throughout the industry, creating 
                sustainable learning pathways for millions.
              </p>
              <Button asChild size="lg">
                <Link to="/learning">Start Learning</Link>
              </Button>
            </div>
            <div className="relative">
              <img 
                src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//40357%20(1).jpg" 
                alt="Team collaboration" 
                className="w-full h-96 object-cover rounded-xl shadow-lg" 
              />
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <value.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <CardTitle>{member.name}</CardTitle>
                    <p className="text-primary font-semibold">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {member.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-white/80 rounded-xl p-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-muted-foreground">Students Enrolled</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Courses Available</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">50+</div>
                <div className="text-muted-foreground">Expert Instructors</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">95%</div>
                <div className="text-muted-foreground">Completion Rate</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are advancing their careers with SkillPulse.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/register">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default AboutPage;
