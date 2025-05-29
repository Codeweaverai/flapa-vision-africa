
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, Award, Heart, Lightbulb, Globe, Calendar, MapPin, Briefcase } from 'lucide-react';
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
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//profile.jpeg",
      description: "Technology leader and entrepreneur passionate about African development."
    },
    {
      name: "George Munganga",
      role: "Head of Technology",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//1675545655734.jpg",
      description: "Full-stack developer building scalable learning platforms."
    },
    {
      name: "David Kimani",
      role: "Head of Learning",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      description: "Educational expert with 15+ years in curriculum development."
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Founded SkillPulse",
      description: "Started with a vision to transform African education through technology"
    },
    {
      year: "2021",
      title: "First 1,000 Students",
      description: "Reached our first milestone of serving 1,000 learners across the continent"
    },
    {
      year: "2022",
      title: "Platform Launch",
      description: "Officially launched our comprehensive learning and event booking platform"
    },
    {
      year: "2023",
      title: "Global Expansion",
      description: "Expanded our reach to serve learners across multiple African countries"
    },
    {
      year: "2024",
      title: "10,000+ Students",
      description: "Celebrating over 10,000 students and 500+ courses on our platform"
    }
  ];

  const facts = [
    {
      icon: Users,
      number: "10,000+",
      label: "Students Enrolled",
      description: "Learners from across Africa and beyond"
    },
    {
      icon: Award,
      number: "500+",
      label: "Courses Available",
      description: "Covering technology, business, and innovation"
    },
    {
      icon: Globe,
      number: "15+",
      label: "Countries Served",
      description: "Expanding across the African continent"
    },
    {
      icon: Briefcase,
      number: "95%",
      label: "Job Placement Rate",
      description: "Of our certified graduates find employment"
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

          {/* Where We Started Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {milestone.year}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fact Sheet Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">By The Numbers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {facts.map((fact, index) => (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <fact.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <div className="text-4xl font-bold text-primary mb-2">{fact.number}</div>
                    <CardTitle className="text-lg">{fact.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {fact.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
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
