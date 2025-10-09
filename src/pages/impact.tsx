import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Award, Globe, Zap, ArrowRight, Star, TrendingUp, Heart, Target, CheckCircle, MapPin, GraduationCap, Lightbulb, Rocket } from 'lucide-react';

const ImpactPage = () => {
  const impactStats = [
    { number: "50,000+", label: "Lives Impacted", icon: Users },
    { number: "15+", label: "African Countries", icon: MapPin },
    { number: "85%", label: "Employment Rate", icon: TrendingUp },
    { number: "2.5M+", label: "Learning Hours", icon: GraduationCap }
  ];

  const successStories = [
    {
      name: "Sarah Chibwe",
      location: "Lusaka, Zambia",
      story: "From market vendor to digital marketer. Sarah now runs her own agency helping local businesses grow online.",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      before: "Market Vendor",
      after: "Digital Marketer"
    },
    {
      name: "David Okafor",
      location: "Lagos, Nigeria",
      story: "Learned web development and now works remotely for international clients, increasing his income by 400%.",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      before: "University Graduate",
      after: "Full-stack Developer"
    },
    {
      name: "Amina Mohammed",
      location: "Nairobi, Kenya",
      story: "Mastered graphic design and now creates branding for African startups while mentoring other young women.",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      before: "Art Student",
      after: "Creative Director"
    }
  ];

  const impactAreas = [
    {
      icon: Lightbulb,
      title: "Digital Skills Training",
      description: "Providing cutting-edge digital skills from coding to digital marketing",
      metrics: "25,000+ trained"
    },
    {
      icon: GraduationCap,
      title: "Youth Empowerment",
      description: "Equipping young Africans with skills for the future job market",
      metrics: "15-30 age group"
    },
    {
      icon: Globe,
      title: "Rural Access",
      description: "Bringing quality education to underserved rural communities",
      metrics: "40% rural reach"
    },
    {
      icon: Rocket,
      title: "Startup Support",
      description: "Nurturing African tech startups and creative entrepreneurs",
      metrics: "200+ startups launched"
    }
  ];

  const regionalImpact = [
    { region: "East Africa", learners: "18,000", growth: "45%" },
    { region: "West Africa", learners: "22,000", growth: "52%" },
    { region: "Southern Africa", learners: "8,000", growth: "38%" },
    { region: "Central Africa", learners: "2,000", growth: "28%" }
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
        <section className="relative min-h-[60vh] flex items-center justify-center pt-20 pb-16">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-6xl mx-auto">
              <Badge className="mb-6 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 px-6 py-2 text-lg font-semibold">
                <Star className="h-4 w-4 mr-2" />
                Our Impact
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                Transforming Lives
                <span className="block bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                  Across Africa
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
                "Witness the powerful stories of change and progress as we empower the next generation 
                of African innovators, creators, and leaders through accessible digital education."
              </p>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="py-16 relative z-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {impactStats.map((stat, index) => {
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

        {/* Success Stories */}
        <section className="py-20 bg-white/50 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Success Stories
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Real people, real transformations. Meet the Africans whose lives have been changed through SkillPulse.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {successStories.map((story, index) => (
                <Card key={index} className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 group overflow-hidden hover:scale-105">
                  <div className="relative p-0.5 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl">
                    <div className="bg-white rounded-xl overflow-hidden">
                      <div className="relative overflow-hidden">
                        <img 
                          src={story.image} 
                          alt={story.name}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{story.name}</h3>
                        <p className="text-orange-600 font-semibold mb-3">{story.location}</p>
                        <div className="flex items-center gap-4 mb-4">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {story.before}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {story.after}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{story.story}</p>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Areas */}
        <section className="py-20 relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Our Impact Areas
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Creating meaningful change across multiple dimensions of African development.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {impactAreas.map((area, index) => {
                const IconComponent = area.icon;
                return (
                  <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group text-center">
                    <CardHeader className="pb-4">
                      <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                        {area.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed mb-4">{area.description}</p>
                      <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                        {area.metrics}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Regional Impact */}
        <section className="py-20 bg-white/50 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Regional Impact
              </h2>
              <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                Our footprint across the African continent, creating opportunities in every region.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {regionalImpact.map((region, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl p-6 text-center hover:shadow-2xl transition-all duration-300 group">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">{region.region}</h3>
                  <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {region.learners}
                  </div>
                  <div className="text-gray-600 mb-2">Learners</div>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    +{region.growth} Growth
                  </Badge>
                </Card>
              ))}
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
                  Be Part of the Change
                </h3>
                <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                  Join thousands of Africans who are transforming their lives and communities 
                  through digital skills and innovation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105">
                    <Link to="/auth">
                      Start Learning Today
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outline" 
                    size="lg"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300"
                  >
                    <Link to="/about">
                      Learn More About Us
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ImpactPage;
