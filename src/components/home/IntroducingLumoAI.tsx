import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Zap, Brain, FileText, Calendar, Users, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const IntroducingLumoAI = () => {
  return (
    <section className="bg-gradient-to-br from-orange-500 to-purple-600 py-20 relative overflow-hidden">
      {/* Pulse Animation Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-400/30 to-purple-500/30 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="section-container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-6">
            <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <Rocket className="h-16 w-16 text-white relative z-10 mx-auto" />
          </div>
          <h2 className="text-6xl font-bold mb-6 text-white">
            LumoAI v1
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-4">
            Create Professional Courses & Events in Minutes, Not Weeks
          </p>
          <p className="text-lg text-white/80 max-w-3xl mx-auto">
            Reduce time to production with AI-powered workflows and better content quality
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Clock,
              title: "Minutes vs Weeks",
              description: "Go from idea to finished course in minutes instead of weeks of planning",
              pulseDelay: '0s'
            },
            {
              icon: TrendingUp,
              title: "Faster Production",
              description: "Reduce time to production with automated content creation",
              pulseDelay: '0.3s'
            },
            {
              icon: Zap,
              title: "Improved Workflows",
              description: "Streamline your creation process with intelligent automation",
              pulseDelay: '0.6s'
            },
            {
              icon: Brain,
              title: "Better Content",
              description: "Generate higher quality course materials with AI assistance",
              pulseDelay: '0.9s'
            }
          ].map((feature, index) => (
            <div key={index} className="relative group">
              <div 
                className="absolute -inset-2 bg-white/20 rounded-2xl blur-lg animate-pulse opacity-60 group-hover:opacity-100 transition-opacity shadow-xl"
                style={{ animationDelay: feature.pulseDelay }}
              ></div>
              <Card className="relative border-0 bg-white/10 backdrop-blur-sm text-center p-6 shadow-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="bg-white/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: FileText,
              title: "Course Structures",
              description: "Complete outlines in minutes"
            },
            {
              icon: Calendar,
              title: "Event Planning",
              description: "Agendas and schedules instantly"
            },
            {
              icon: Users,
              title: "Audience Focused",
              description: "Tailored to your learners"
            }
          ].map((feature, index) => (
            <div key={index} className="relative group">
              <div className="absolute -inset-1 bg-white/15 rounded-xl blur-md animate-pulse" style={{ animationDelay: `${index * 0.4}s` }}></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center shadow-lg hover:shadow-xl transition-shadow">
                <feature.icon className="h-6 w-6 text-white mx-auto mb-2" />
                <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                <p className="text-white/70 text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Central CTA Card */}
        <div className="max-w-lg mx-auto text-center">
          <div className="relative">
            <div className="absolute -inset-8 bg-white/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.2s' }}></div>
            <Card className="relative border-0 bg-white/15 backdrop-blur-sm shadow-2xl">
              <CardContent className="p-8">
                <Zap className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-4">
                  Start Creating Today
                </h3>
                <p className="text-white/80 mb-6">
                  Transform your ideas into professional learning experiences in minutes
                </p>
                <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-white/90 font-bold px-8 py-4 rounded-xl shadow-lg text-lg w-full">
                  <Link to="/lumoai">Launch LumoAI</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroducingLumoAI;
