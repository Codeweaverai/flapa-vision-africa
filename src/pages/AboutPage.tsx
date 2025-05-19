
import Layout from '@/components/layout/Layout';
import { User, Award, BookOpen, Map, Briefcase, Globe, Layers, Heart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="heading-lg mb-6 text-gradient">About SkillPulse</h1>
            <p className="text-lg mb-6">
              Skills and Event Booking Platform Marketplace | Connecting Expertise with Opportunity | Based on innovative technology and professional growth.
              An innovative platform dedicated to transforming the professional development and event booking landscape.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Map className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Vision</h3>
                  <p>Bridging the gap between expertise and opportunity, creating sustainable growth and professional advancement for all users.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Industry Focus</h3>
                  <p>Specialized in professional development, skill enhancement, event management, and educational technology innovation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Platform Features</h3>
                  <p>Comprehensive event booking system, expert-led courses, professional networking opportunities, and skill certification programs.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link to="/ventures">Explore Platform</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/speaking">Expert Sessions</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81" 
              alt="SkillPulse Platform" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8">Platform Evolution</h2>
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Launch & Expansion</h3>
                  <p className="text-primary font-medium">SkillPulse Marketplace</p>
                </div>
                <div className="text-muted-foreground mt-1">December 2020 - Present</div>
              </div>
              <p>
                Since launch, SkillPulse has grown into a comprehensive skills and event booking platform, 
                connecting professionals with opportunities for growth and development. The platform continues 
                to expand its offerings and reach, serving a diverse community of learners and experts.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Educational Partnership Phase</h3>
                  <p className="text-primary font-medium">Professional Development Focus</p>
                </div>
                <div className="text-muted-foreground mt-1">January 2020 - December 2020</div>
              </div>
              <p>
                Established key partnerships with educational institutions and professional organizations to enhance platform offerings.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Platform Development</h3>
                  <p className="text-primary font-medium">Technology Foundation</p>
                </div>
                <div className="text-muted-foreground mt-1">January 2015 - December 2019</div>
              </div>
              <p>
                Development of core platform infrastructure, focusing on creating a robust, scalable system 
                to support educational content delivery, event management, and professional networking capabilities.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8">Key Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Layers className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Event Booking System</h3>
              <p>
                Comprehensive event management and booking capabilities, allowing users to discover, 
                register for, and participate in professional development events.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Star className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Skills Marketplace</h3>
              <p>
                Platform for experts to share knowledge and skills through courses, 
                workshops, and one-on-one sessions with integrated booking and payment systems.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Heart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Professional Growth</h3>
              <p>
                Focused on facilitating career advancement through skill acquisition, 
                professional networking, and certification opportunities.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8">Technical Platform & Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">Technology Stack</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">React Frontend</p>
                    <p className="text-sm text-muted-foreground">Modern, responsive user interface for optimal experience</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Secure Authentication</p>
                    <p className="text-sm text-muted-foreground">Enterprise-grade security for user data and transactions</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Cloud Infrastructure</p>
                    <p className="text-sm text-muted-foreground">Scalable architecture supporting thousands of concurrent users</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">Core Platform Features</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Integrated Payment Processing</p>
                    <p className="text-sm text-muted-foreground">Secure transaction handling for course and event bookings</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Analytics Dashboard</p>
                    <p className="text-sm text-muted-foreground">Comprehensive tracking of user engagement and progress</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Content Management System</p>
                    <p className="text-sm text-muted-foreground">Robust tools for creating and delivering educational content</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Event Management Tools</p>
                    <p className="text-sm text-muted-foreground">Comprehensive system for organizing and promoting professional events</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="heading-md mb-8">Platform Mission</h2>
          <div className="bg-muted rounded-lg p-8">
            <p className="text-xl italic text-center">
              "Our mission is to connect expertise with opportunity across industries. 
              Through technological innovation and educational excellence, we're dedicated to 
              facilitating professional growth, skill development, and community building."
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
