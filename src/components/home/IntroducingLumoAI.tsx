import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, Zap, Sparkles, Brain, FileText, Calendar, Users, Target, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const IntroducingLumoAI = () => {
  return (
    <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 py-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-indigo-300/20 to-pink-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-blue-500/25 to-purple-600/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      <div className="section-container relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <span className="relative px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full inline-flex items-center">
              <Rocket className="h-4 w-4 mr-2" />
              NEW RELEASE
            </span>
          </div>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
            Introducing LumoAI v1
          </h2>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Your AI-Powered Course & Event Creation Engine — Powered by SkillPulse
          </p>
        </div>

        {/* Main Description */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                LumoAI is SkillPulse's breakthrough artificial intelligence tool designed to help creators build 
                high-quality learning experiences effortlessly. Whether you're launching a course, hosting an event, 
                or creating a full training program, LumoAI automatically generates everything you need — in minutes.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: FileText,
              title: "Generate Complete Course Structures",
              description: "LumoAI builds full course outlines with modules, lessons, learning objectives, activities, and assessments — all tailored to your topic.",
              color: "from-blue-500 to-cyan-500"
            },
            {
              icon: Brain,
              title: "Write High-Quality Lesson Content",
              description: "From scripts and summaries to quizzes and assignments, LumoAI produces ready-to-use learning materials that match your tone and teaching style.",
              color: "from-purple-500 to-pink-500"
            },
            {
              icon: Calendar,
              title: "Create Event Descriptions & Agendas",
              description: "Hosting a workshop or seminar? LumoAI crafts polished event descriptions, speaker bios, schedules, and content sections instantly.",
              color: "from-green-500 to-teal-500"
            },
            {
              icon: Users,
              title: "Personalized to Your Audience",
              description: "Whether your audience is beginner or advanced, LumoAI adapts content difficulty, structure, and style to meet their needs.",
              color: "from-orange-500 to-red-500"
            },
            {
              icon: Zap,
              title: "Instantly Publish on SkillPulse",
              description: "With one click, creators can send generated content into their SkillPulse creator dashboard for editing or publishing.",
              color: "from-indigo-500 to-purple-500"
            },
            {
              icon: Target,
              title: "Focus on What Matters",
              description: "LumoAI removes the hardest part of teaching online: planning, writing, and structuring content.",
              color: "from-cyan-500 to-blue-500"
            }
          ].map((feature, index) => (
            <div key={index} className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <Card className="relative border-0 shadow-xl bg-white/90 backdrop-blur-sm h-full group-hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6">
                  <div className={`bg-gradient-to-r ${feature.color} p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4 shadow-lg`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Why LumoAI Matters */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-8 text-white text-center mb-16 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          <div className="relative z-10">
            <Zap className="h-12 w-12 mx-auto mb-4 text-yellow-300" />
            <h3 className="text-3xl font-bold mb-4">Why LumoAI Matters</h3>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              LumoAI removes the hardest part of teaching online: planning, writing, and structuring content.
              This lets creators focus on what matters most — sharing expertise and growing their audience.
            </p>
          </div>
        </div>

        {/* Powered by SkillPulse */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white inline-flex items-center space-x-4 shadow-2xl">
            <Globe className="h-8 w-8 text-blue-400" />
            <div className="text-left">
              <p className="text-sm text-gray-400">Powered by</p>
              <p className="text-xl font-bold">SkillPulse Ecosystem</p>
            </div>
          </div>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            LumoAI is built natively into the SkillPulse ecosystem, giving creators an integrated AI assistant 
            that transforms ideas into full, professional learning experiences.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-blue-50/90 backdrop-blur-sm max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-4">
                Ready to Try <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">LumoAI v1</span>?
              </h3>
              <p className="text-gray-700 mb-6 text-lg">
                Start creating professional courses and events in minutes with our breakthrough AI technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg">
                  <Link to="/lumoai">Get Started with LumoAI</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-blue-300 text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 font-semibold px-8 py-3 rounded-xl">
                  <Link to="/auth">Become a Creator</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default IntroducingLumoAI;
