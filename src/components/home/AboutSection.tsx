import React from 'react';
import { ArrowRight, CheckCircle, Users, Award, Zap, Target, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutSection = () => {
  const features = [
    {
      icon: Target,
      title: "Skills-First Approach",
      description: "Master in-demand skills through immersive courses and real-world projects"
    },
    {
      icon: Users,
      title: "Creator Ecosystem",
      description: "Join a thriving community where experts monetize their knowledge across formats"
    },
    {
      icon: Zap,
      title: "Accelerated Growth",
      description: "Fast-track your career with hands-on learning and industry-relevant skills"
    },
    {
      icon: Globe,
      title: "Borderless Access",
      description: "Access global opportunities regardless of your geographical location"
    }
  ];

  const missionStats = [
    { number: "10,000+", label: "Skills Mastered" },
    { number: "500+", label: "Expert Creators" },
    { number: "50+", label: "Countries Reached" },
    { number: "1,000+", label: "Live Events" }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Building Africa's Skills Ecosystem
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              SkillPulse is revolutionizing how skills are developed and shared across Africa and beyond. 
              We're creating a dynamic ecosystem where learners master career-transforming skills and 
              creators build sustainable businesses through their expertise.
            </p>
            
            <div className="mb-6 p-6 bg-white rounded-2xl shadow-lg border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-500" />
                Our Mission
              </h3>
              <p className="text-gray-700 italic">
                "To be the leading skills ecosystem, where learners master in-demand skills through 
                immersive courses and events, and creators monetize their expertise across every format."
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{feature.title}</h4>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mission Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {missionStats.map((stat, index) => (
                <div key={index} className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/about" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-purple-700 transition-all hover:scale-105"
            >
              Explore Our Ecosystem
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          
          <div className="relative">
            <img
              src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//african-american-blogger-reviewing-studio-light-camera%20(1).jpg?w=600&h=400&fit=crop&crop=faces"
              alt="Skill development in action"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-orange-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white">
              <div className="text-3xl font-bold mb-1">2024</div>
              <div className="text-sm opacity-90">Pioneering Skills Ecosystem</div>
            </div>
            <div className="absolute -top-4 -right-4 bg-white p-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-bold text-gray-800">Leading Platform</div>
                  <div className="text-xs text-gray-600">Skills & Events</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
