
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Bot, MessageCircle, Sparkles, Brain, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

const CommunityAISection = () => {
  return (
    <section className="bg-light-purple py-20">
      <div className="section-container">
        <div className="text-center mb-16">
          <h2 className="heading-lg mb-6">
            Our <span className="text-gradient">Community</span> & AI Innovation
          </h2>
          <p className="text-lg text-flapabay-dark max-w-3xl mx-auto">
            Join a thriving community of learners and creators, enhanced by cutting-edge AI technology 
            that personalizes your learning journey and connects you with like-minded professionals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Vibrant Community</h3>
                <p className="text-flapabay-dark">
                  Connect with thousands of learners, creators, and industry experts. 
                  Share knowledge, collaborate on projects, and grow together.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <MessageCircle className="h-6 w-6 text-primary animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Real-time Discussions</h3>
                <p className="text-flapabay-dark">
                  Engage in meaningful conversations through our community chat, 
                  course discussions, and expert Q&A sessions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Network className="h-6 w-6 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Professional Networking</h3>
                <p className="text-flapabay-dark">
                  Build valuable professional relationships and discover new opportunities 
                  within our diverse community ecosystem.
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-primary to-purple-600 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Users className="h-10 w-10 text-white animate-pulse" />
                  </div>
                  <h4 className="text-2xl font-bold mb-4">50,000+</h4>
                  <p className="text-flapabay-dark">Active Community Members</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Floating animation elements */}
            <div className="absolute -top-4 -right-4 bg-primary/20 rounded-full p-2 animate-bounce">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-purple-500/20 rounded-full p-2 animate-pulse">
              <Network className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* AI Innovation Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl p-8 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-r from-primary to-purple-600 p-3 rounded-full">
                    <Bot className="h-8 w-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">AI-Powered Learning</h4>
                    <p className="text-sm text-flapabay-dark">Personalized & Intelligent</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-sm">Smart course recommendations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-5 w-5 text-purple-600 animate-bounce" />
                    <span className="text-sm">Adaptive learning paths</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-sm">AI tutoring assistance</span>
                  </div>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute top-4 right-4 opacity-20">
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-primary rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Brain className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
                <p className="text-flapabay-dark">
                  Our AI analyzes your learning patterns and preferences to suggest 
                  the most relevant courses and learning paths tailored just for you.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Sparkles className="h-6 w-6 text-primary animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Adaptive Learning</h3>
                <p className="text-flapabay-dark">
                  Experience personalized learning that adapts to your pace, style, 
                  and goals, ensuring maximum retention and skill development.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Bot className="h-6 w-6 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">AI Learning Assistant</h3>
                <p className="text-flapabay-dark">
                  Get instant help with our AI tutoring assistant that provides 
                  explanations, answers questions, and guides you through complex topics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Join Our <span className="text-gradient">AI-Enhanced</span> Community?
              </h3>
              <p className="text-flapabay-dark mb-6">
                Experience the future of learning with our intelligent platform and vibrant community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="animate-fade-in">
                  <Link to="/community">Explore Community</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="animate-fade-in">
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
