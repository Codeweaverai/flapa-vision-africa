
import React from 'react';
import { ArrowRight, CheckCircle, Users, Award, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutSection = () => {
  const features = [
    {
      icon: Users,
      title: "Global Community",
      description: "Connect with learners and creators from around the world"
    },
    {
      icon: Award,
      title: "Quality Content",
      description: "Access high-quality courses from verified instructors"
    },
    {
      icon: Zap,
      title: "Fast Learning",
      description: "Learn at your own pace with our interactive platform"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              About SkillPulse
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              SkillPulse is a revolutionary learning platform that connects passionate instructors 
              with eager learners worldwide. Our mission is to democratize education and make 
              quality learning accessible to everyone, everywhere.
            </p>
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
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
            <Link 
              to="/about" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-purple-700 transition-all"
            >
              Learn More About Us
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="relative">
            <img
              src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//african-american-blogger-reviewing-studio-light-camera%20(1).jpg?w=600&h=400&fit=crop&crop=faces"
              alt="Students learning together"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl">
              <div className="text-3xl font-bold text-orange-600 mb-1">10,000+</div>
              <div className="text-gray-600 text-sm">Happy Learners</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
