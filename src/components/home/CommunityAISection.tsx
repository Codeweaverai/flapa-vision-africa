
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Bot, MessageCircle, Sparkles, Brain, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommunityAISection = () => {
  return (
    <section className="bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100 py-20 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
      </div>
      
      <div className="section-container relative z-10">
        <div className="text-center mb-16">
          <div className="relative">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Our Community & AI Innovation
            </h2>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-orange-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          </div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Join a thriving community of learners and creators, enhanced by cutting-edge AI technology 
            that personalizes your learning journey and connects you with like-minded professionals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-8">
            <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Vibrant Community</h3>
                <p className="text-gray-600">
                  Connect with thousands of learners, creators, and industry experts. 
                  Share knowledge, collaborate on projects, and grow together.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-full">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Real-time Discussions</h3>
                <p className="text-gray-600">
                  Engage in meaningful conversations through our community chat, 
                  course discussions, and expert Q&A sessions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-orange-600 to-purple-700 p-3 rounded-full">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Professional Networking</h3>
                <p className="text-gray-600">
                  Build valuable professional relationships and discover new opportunities 
                  within our diverse community ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/90 to-orange-50/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h4 className="text-3xl font-bold mb-2 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">50,000+</h4>
                  <p className="text-gray-700 font-medium">Active Community Members</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Floating animation elements */}
            <div className="absolute -top-6 -right-6 bg-gradient-to-r from-orange-400/30 to-purple-500/30 rounded-full p-3 animate-bounce shadow-lg">
              <MessageCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-purple-400/30 to-pink-500/30 rounded-full p-3 animate-pulse shadow-lg">
              <Network className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* AI Innovation Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="bg-gradient-to-br from-orange-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl p-8 relative overflow-hidden shadow-xl border border-white/20">
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full shadow-lg">
                    <Bot className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-800">AI-Powered Learning</h4>
                    <p className="text-sm text-gray-600 font-medium">Personalized & Intelligent</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                    <Brain className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Smart course recommendations</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Adaptive learning paths</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl">
                    <MessageCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">AI tutoring assistance</span>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute top-4 right-4 opacity-10">
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(16)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Smart Recommendations</h3>
                <p className="text-gray-600">
                  Our AI analyzes your learning patterns and preferences to suggest 
                  the most relevant courses and learning paths tailored just for you.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-full">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Adaptive Learning</h3>
                <p className="text-gray-600">
                  Experience personalized learning that adapts to your pace, style, 
                  and goals, ensuring maximum retention and skill development.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-r from-orange-600 to-purple-700 p-3 rounded-full">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">AI Learning Assistant</h3>
                <p className="text-gray-600">
                  Get instant help with our AI tutoring assistant that provides 
                  explanations, answers questions, and guides you through complex topics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/95 to-orange-50/90 backdrop-blur-sm max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-3xl font-bold mb-4">
                Ready to Join Our <span className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">AI-Enhanced</span> Community?
              </h3>
              <p className="text-gray-700 mb-6 text-lg">
                Experience the future of learning with our intelligent platform and vibrant community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg">
                  <Link to="/community">Explore Community</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-orange-300 text-orange-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 font-semibold px-8 py-3 rounded-xl">
                  <Link to="/explore/courses">Browse AI-Curated Courses</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CommunityAISection;
