
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Target, Globe, Award, Calendar, MapPin } from 'lucide-react';

const AboutPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              About SkillPulse
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering professionals across Africa through expert-led learning, networking, and growth opportunities.
            </p>
          </div>

          {/* Where We Started Section */}
          <div className="mb-16">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-center mb-4">Where We Started</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-purple-600">Our Origin Story</h3>
                    <p className="text-muted-foreground mb-4">
                      SkillPulse was founded in 2023 with a simple yet powerful vision: to bridge the skills gap across Africa 
                      by connecting professionals with world-class learning opportunities and industry experts.
                    </p>
                    <p className="text-muted-foreground mb-4">
                      Starting from Johannesburg, South Africa, our platform began as a response to the growing need for 
                      accessible, high-quality professional development in emerging markets.
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Founded in Johannesburg, South Africa</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4" />
                      <span>Established in 2023</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-100 to-orange-100 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-center">Founding Principles</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Accessible quality education for all</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Practical, industry-relevant skills</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Building communities of practice</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Empowering local expertise</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fact Sheet Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">SkillPulse by the Numbers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center border-orange-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">2,500+</div>
                  <p className="text-muted-foreground">Active Learners</p>
                </CardContent>
              </Card>
              <Card className="text-center border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">150+</div>
                  <p className="text-muted-foreground">Expert Instructors</p>
                </CardContent>
              </Card>
              <Card className="text-center border-orange-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">50+</div>
                  <p className="text-muted-foreground">Countries Reached</p>
                </CardContent>
              </Card>
              <Card className="text-center border-purple-200">
                <CardContent className="pt-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
                  <p className="text-muted-foreground">Completion Rate</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-6 w-6 mr-2 text-purple-600" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To democratize access to high-quality professional development across Africa, 
                  fostering a community of skilled professionals who drive economic growth and innovation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-6 w-6 mr-2 text-orange-600" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To become Africa's leading platform for professional learning and networking, 
                  empowering every professional to reach their full potential.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What Sets Us Apart */}
          <Card className="border-purple-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center">What Sets Us Apart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Expert Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Learn from industry leaders and successful entrepreneurs across various sectors.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Practical Learning</h3>
                  <p className="text-sm text-muted-foreground">
                    Hands-on courses designed for immediate application in real-world scenarios.
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">African Focus</h3>
                  <p className="text-sm text-muted-foreground">
                    Content tailored specifically for African markets and business environments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
