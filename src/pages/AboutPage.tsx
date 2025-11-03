import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Award, Globe, Zap, Heart, Target, CheckCircle, ArrowRight, Linkedin, Twitter, Mail, Play, Star, TrendingUp, BookOpen, Shield, Quote, Building, Calendar, Rocket } from 'lucide-react';
import YouTubeModal from '@/components/video/YouTubeModal';
import ReactCountryFlag from "react-country-flag";

const AboutPage = () => {
  const [showVideo, setShowVideo] = useState(false);
  const videoUrl = "https://youtu.be/B8ay-17oP_0?si=4qFRvqzRSLq_gfTH";

  // Supported countries data
  const supportedCountries = [
    { name: 'Zambia', code: 'ZM' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Ghana', code: 'GH' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Malawi', code: 'MW' },
    { name: 'Mozambique', code: 'MZ' },
    { name: 'Senegal', code: 'SN' },
    { name: 'Benin', code: 'BJ' },
    { name: 'Burkina Faso', code: 'BF' },
    { name: 'Cameroon', code: 'CM' },
    { name: 'Congo-Brazzaville', code: 'CG' },
    { name: 'DRC', code: 'CD' },
    { name: 'Gabon', code: 'GA' },
    { name: 'Ivory Coast', code: 'CI' },
    { name: 'Lesotho', code: 'LS' },
    { name: 'Sierra Leone', code: 'SL' }
  ];

  const featuredCountries = supportedCountries.slice(0, 6);
  const additionalCountries = supportedCountries.slice(6);

  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "Building collaborative learning ecosystems where knowledge flows freely and connections thrive."
    },
    {
      icon: Award,
      title: "Excellence",
      description: "Setting the highest standards in content quality, platform performance, and user experience."
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Breaking geographical barriers to make world-class education accessible to everyone, everywhere."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "Leveraging cutting-edge technology to create immersive and effective learning experiences."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Learners", icon: Users },
    { number: "500+", label: "Expert Instructors", icon: Award },
    { number: "1,000+", label: "Courses Available", icon: BookOpen },
    { number: "50+", label: "Countries Reached", icon: Globe }
  ];

  const features = [
    "Interactive video learning with AI-powered insights",
    "Real-time collaborative discussions",
    "Mobile-optimized seamless experience",
    "Industry-recognized certificate programs",
    "Advanced progress tracking & analytics",
    "24/7 community support network"
  ];

  const companyTrack = [
    {
      icon: Building,
      title: "Corporate Structure",
      items: [
        { label: "Parent Company", value: "FlapaBay Group" },
        { label: "Legal Entity", value: "SkillPulse Innovations Limited" },
        { label: "Entity Type", value: "Subsidiary" }
      ]
    },
    {
      icon: Calendar,
      title: "Company Timeline",
      items: [
        { label: "Founded", value: "2024" },
        { label: "Incorporated", value: "2025" },
        { label: "Status", value: "Rapid Growth Phase" }
      ]
    },
    {
      icon: Rocket,
      title: "Core Focus",
      items: [
        { label: "Primary Mission", value: "Skills Ecosystem" },
        { label: "Target Audience", value: "Learners & Creators" },
        { label: "Key Offerings", value: "Courses & Events" }
      ]
    }
  ];

  const teamMembers = [
    {
      name: "Mbolela Pule",
      role: "CEO & Founder",
      bio: "Driven by a passion to democratize education across Africa through innovative technology. With over 7 years of experience in EdTech and Travel Tech, he is committed to building accessible, impactful learning and event platforms that empower individuals and creators alike.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/WhatsApp%20Image%202025-10-09%20at%2021.14.53_f06845c1.jpg?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "mbolela.pule@skillpulse.cloud"
    },
    {
      name: "George Munganga",
      role: "Chief Technology Officer",
      bio: "A full-stack developer with deep expertise in building scalable learning platforms and integrating AI to enhance user experiences and educational outcomes.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//1675545655734.jpg?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "george@skillpulse.cloud"
    },
    {
      name: "Nakolo Pule",
      role: "Head of Content",
      bio: "Specializing in content creation and finance, where she leads the development of engaging, high-quality educational material tailored to empower learners and creators alike.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/WhatsApp%20Image%202025-10-09%20at%2021.05.23_3e2ef36d.jpg?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "nakolo@skillpulse.cloud"
    },
    {
      name: "Chishala Kapobe",
      role: "Director Learning & Events Operations",
      bio: "Director of Learning & Events Operations with a focus on crafting intuitive, accessible digital learning experiences and managing impactful events for creators across Africa.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//WhatsApp_Image_2025-07-02_at_10.54.42_bec1ba2c-removebg-preview%20(1).png?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "chishala@skillpulse.cloud"
    },
    {
      name: "Jessica Komani",
      role: "Director Company Secretary",
      bio: "Experienced legal professional specializing in corporate governance and compliance. Ensures regulatory adherence and provides strategic legal guidance to support the company's mission of transforming education across Africa.",
      image: "https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/WhatsApp%20Image%202025-09-26%20at%2010.43.26_892d6d70.jpg?w=400&h=400&fit=crop&crop=face",
      linkedin: "#",
      twitter: "#",
      email: "jessica@skillpulse.cloud"
    }
  ];

  const achievements = [
    {
      icon: Award,
      title: "Best EdTech Platform 2024",
      description: "Recognized for innovation in online education"
    },
    {
      icon: Users,
      title: "10K+ Community",
      description: "Active learners across 50+ countries"
    },
    {
      icon: TrendingUp,
      title: "95% Success Rate",
      description: "Learners achieving their goals"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security standards"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
        </div>

        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center justify-center pt-20 pb-16">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-6xl mx-auto">
              <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-6 py-2 text-lg font-semibold">
                <Star className="h-4 w-4 mr-2" />
                Transforming your workflow with winning skills.
              </Badge>
              
              <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
                Empowering The
                <span className="block bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Skill-Driven Generation
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
                "Democratizing skill development and event hosting to empower creators worldwide 
                through innovative technology and accessible learning experiences."
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg text-lg transition-all duration-300 hover:scale-105">
                  <Link to="/auth">
                    Start Learning Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => setShowVideo(true)}
                  className="border-2 border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Our Story
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl text-center p-6 hover:shadow-2xl transition-all duration-300 group">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {stat.number}
                    </div>
                    <div className="text-gray-600 font-medium">{stat.label}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Mission Card */}
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl p-8">
                <CardHeader className="text-center pb-6">
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center text-white">
                    <Target className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Our Mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-700 mb-8 leading-relaxed text-center">
                    "To be the leading skills ecosystem, where learners master in-demand skills through immersive courses 
                    and events, and creators monetize their expertise across every format."
                  </p>
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-orange-50 to-purple-50">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vision Card */}
              <Card className="bg-gradient-to-r from-purple-600 to-orange-500 text-white shadow-2xl p-8">
                <CardHeader className="text-center pb-6">
                  <div className="bg-white/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                    <Globe className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-3xl font-bold">
                    Our Vision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg mb-8 leading-relaxed text-center opacity-95">
                    "We envision a world where geography is no barrier to growth—a global ecosystem where lifelong learners accelerate their careers through skills, 
                    and impactful creators build communities through courses and live experiences."
                  </p>
                  <div className="text-center">
                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105"
                    >
                      Join Our Movement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Company Track Sheet Section */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Corporate Foundation
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Building Africa's premier skills ecosystem on a solid corporate framework
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {companyTrack.map((track, index) => {
                const IconComponent = track.icon;
                return (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl font-bold text-center bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {track.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {track.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-orange-50 to-purple-50 group-hover:from-orange-100 group-hover:to-purple-100 transition-all duration-300">
                            <span className="text-sm font-medium text-gray-600">{item.label}</span>
                            <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 font-semibold">
                              {item.value}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Corporate Identity Badge */}
            <div className="mt-12 text-center">
              <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-2xl max-w-2xl mx-auto">
                <CardContent className="p-8 text-white">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Building className="h-8 w-8" />
                    <Star className="h-8 w-8" />
                    <Rocket className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">SkillPulse Innovations Limited</h3>
                  <p className="text-white/90 mb-4">A Subsidiary of FlapaBay Group</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      Founded: 2024
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      Incorporated: 2025
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      Focus: Skills Ecosystem
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Our Core Values
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                The principles that guide our decisions, shape our culture, and drive our mission forward.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group text-center">
                    <CardHeader className="pb-4">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {value.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Achievements Section */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Our Achievements
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Milestones that mark our journey in transforming education and empowering communities.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {achievements.map((achievement, index) => {
                const IconComponent = achievement.icon;
                return (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl p-6 text-center hover:shadow-2xl transition-all duration-300 group">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full w-14 h-14 mx-auto mb-4 flex items-center justify-center text-white">
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{achievement.title}</h3>
                    <p className="text-gray-600 text-sm">{achievement.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-white/50 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Meet Our Visionaries
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                The passionate leaders driving innovation and transforming education through technology.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {teamMembers.map((member, index) => (
                <Card key={index} className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group overflow-hidden hover:scale-105">
                  {/* Gradient Border Effect */}
                  <div className="relative p-0.5 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl">
                    <div className="bg-white rounded-xl overflow-hidden">
                      {/* Profile Image with Gradient Overlay */}
                      <div className="relative overflow-hidden">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-60 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        
                        {/* Role Badge */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full text-center backdrop-blur-sm">
                            {member.role}
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <CardContent className="p-5 text-center">
                        <h3 className="text-sm font-bold text-gray-800 mb-2 leading-tight">
                          {member.name}
                        </h3>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed line-clamp-3">
                          {member.bio}
                        </p>
                        
                        {/* Social Links */}
                        <div className="flex justify-center gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1.5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 rounded-full transition-all duration-300 group/social"
                          >
                            <Linkedin className="h-3 w-3 text-gray-500 group-hover/social:text-orange-600 transition-colors" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1.5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 rounded-full transition-all duration-300 group/social"
                          >
                            <Twitter className="h-3 w-3 text-gray-500 group-hover/social:text-purple-600 transition-colors" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1.5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 rounded-full transition-all duration-300 group/social"
                          >
                            <Mail className="h-3 w-3 text-gray-500 group-hover/social:text-gray-700 transition-colors" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Global Reach Section */}
        <section className="py-20 bg-gradient-to-r from-purple-50 via-orange-50 to-purple-50 relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Our Global Footprint
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Empowering creators and learners across Africa with our innovative platform
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              {/* Featured Countries Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {featuredCountries.map((country, index) => (
                  <Card 
                    key={country.code}
                    className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in hover-scale group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3">
                        <ReactCountryFlag
                          countryCode={country.code}
                          svg
                          style={{
                            width: '32px',
                            height: '24px',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}
                          title={country.name}
                        />
                      </div>
                      <h3 className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors duration-200">
                        {country.name}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Additional Countries */}
              {additionalCountries.length > 0 && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-lg font-semibold text-muted-foreground">
                      And {additionalCountries.length} more countries across Africa...
                    </p>
                  </div>
                  
                  <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {additionalCountries.map((country, index) => (
                          <div 
                            key={country.code}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-purple-50 hover:from-orange-50 hover:to-purple-50 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <ReactCountryFlag
                              countryCode={country.code}
                              svg
                              style={{
                                width: '24px',
                                height: '18px',
                                borderRadius: '3px',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                              }}
                              title={country.name}
                            />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors duration-200">
                              {country.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Global Impact Stats */}
            <div className="mt-12 text-center">
              <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-2xl max-w-2xl mx-auto">
                <CardContent className="p-8 text-white">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Globe className="h-8 w-8" />
                    <Users className="h-8 w-8" />
                    <Award className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Making Education Accessible</h3>
                  <p className="text-white/90 mb-4">
                    Reaching learners and creators in {supportedCountries.length}+ African countries with localized payment solutions and mobile-first experiences.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      Mobile Money Support
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      Localized Payments
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      Multi-Currency
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Impact Hero Section */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Background Image with Gradient Overlay */}
              <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
                <img 
                  src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset/citizen-amazed-by-city-buildings.jpg"
                  alt="Skill Development in Africa"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-purple-600/80"></div>
                
                {/* Content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white max-w-4xl mx-auto px-6">
                    <Quote className="h-12 w-12 mx-auto mb-6 text-white/80" />
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                      Revolutionizing Skill Development
                      <span className="block text-white/90 mt-2">Across Africa</span>
                    </h2>
                    <p className="text-lg md:text-xl lg:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
                      "SkillPulse is bridging the digital divide by making quality education accessible 
                      to every African youth. We're not just teaching skills—we're building the next 
                      generation of innovators, creators, and leaders who will transform our continent."
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        size="lg"
                        className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105"
                      >
                        Join the Movement
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <Card className="bg-gradient-to-r from-orange-500 to-purple-600 border-0 shadow-2xl max-w-4xl mx-auto overflow-hidden">
              <CardContent className="p-12 text-center text-white">
                <div className="mb-6">
                  <Heart className="h-16 w-16 mx-auto mb-4 text-white/90" />
                </div>
                <h3 className="text-4xl font-bold mb-6">
                  Ready to Transform Lives?
                </h3>
                <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                  Join our mission to democratize education and empower the next generation 
                  of learners and creators worldwide.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105">
                    <Link to="/explore-courses">
                      Explore Courses
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    variant="secondary" 
                    size="lg"
                    className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300"
                  >
                    <Link to="/become-creator">
                      Become a Creator
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* YouTube Video Modal */}
      <YouTubeModal
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
        videoUrl={videoUrl}
        title="SkillPulse Platform Demo"
        className="max-w-4xl"
      />
    </Layout>
  );
};

export default AboutPage;
