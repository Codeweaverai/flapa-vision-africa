
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Play, X } from 'lucide-react';

const AboutSection = () => {
  const [showVideo, setShowVideo] = useState(false);
  const videoUrl = "https://youtu.be/B8ay-17oP_0?si=4qFRvqzRSLq_gfTH";
  const embedUrl = "https://www.youtube.com/embed/B8ay-17oP_0";

  return (
    <section className="bg-light-purple">
      <div className="section-container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="w-full h-[400px] rounded-xl overflow-hidden animate-fade-in">
              <img 
                src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//african-american-blogger-reviewing-studio-light-camera%20(1).jpg" 
                alt="SkillPulse Team" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl max-w-xs animate-slide-in">
              <blockquote className="italic text-flapabay-dark">
                "Our platform bridges the gap between expertise and opportunity, connecting skilled professionals with those eager to learn and grow."
              </blockquote>
              <p className="mt-4 font-bold">- SkillPulse Team</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Skills Marketplace <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Platform</span>
            </h2>
            <p className="mb-4 text-lg">
              SkillPulse is a pioneering skills and event booking platform transforming how people 
              learn and grow professionally. With a unique blend of technical innovation and 
              educational expertise, we've built SkillPulse to harness collective knowledge 
              for professional advancement.
            </p>
            <p className="mb-6 text-lg">
              Our mission is to bridge the gap between expertise and opportunity, driving 
              professional growth, and fostering community development throughout the industry, creating 
              sustainable learning pathways for millions.
            </p>
            <Button asChild size="lg">
              <Link to="/about">Learn More About SkillPulse</Link>
            </Button>
          </div>
        </div>

        {/* YouTube Video Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold mb-4">
              Watch Our <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Story</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how SkillPulse is revolutionizing professional development and connecting learners with expert instructors worldwide.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {!showVideo ? (
              <div 
                className="relative bg-gradient-to-br from-orange-100 via-purple-50 to-pink-100 rounded-2xl overflow-hidden cursor-pointer group shadow-2xl"
                onClick={() => setShowVideo(true)}
              >
                <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-purple-600/20 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-2">Watch Our Introduction</h4>
                    <p className="text-gray-600">See how SkillPulse transforms learning</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-purple-600/10 group-hover:from-orange-500/20 group-hover:to-purple-600/20 transition-all duration-300"></div>
              </div>
            ) : (
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-video">
                  <iframe
                    src={embedUrl}
                    title="SkillPulse Introduction"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <button
                  onClick={() => setShowVideo(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Learn</h4>
              <p className="text-sm text-gray-600">Access expert-led courses and develop new skills</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Connect</h4>
              <p className="text-sm text-gray-600">Network with professionals and attend events</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h4 className="font-semibold text-lg mb-2">Grow</h4>
              <p className="text-sm text-gray-600">Advance your career and achieve your goals</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
