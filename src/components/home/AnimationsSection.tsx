
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const AnimationsSection = () => {
  return (
    <section className="bg-flapabay-dark text-white py-16 md:py-24">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-4">AI Animations</h2>
          <p className="text-xl max-w-3xl mx-auto">
            Explore visual stories about technology, innovation, and entrepreneurship in Africa
            through our custom animations and explanatory videos.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Featured animation */}
          <div className="group relative rounded-xl overflow-hidden aspect-video shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80" 
              alt="The Future of African Logistics" 
              className="w-full h-full object-cover transition-transform group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 flex flex-col justify-end p-6">
              <h3 className="text-2xl font-bold mb-2">The Future of African Logistics</h3>
              <p className="mb-4">
                How technology is revolutionizing the movement of goods across the continent
              </p>
              <Button variant="outline" className="w-12 h-12 rounded-full p-0 flex items-center justify-center bg-white/20 backdrop-blur-sm hover:bg-white/30">
                <Play className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Animation item */}
            <div className="group flex gap-4 items-center bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80" 
                  alt="AI in Business" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">AI in African Business</h4>
                <p className="text-gray-300">4 min explainer on implementing AI in African startups</p>
              </div>
            </div>
            
            {/* Animation item */}
            <div className="group flex gap-4 items-center bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80" 
                  alt="Tech Infrastructure" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">Building Tech Infrastructure</h4>
                <p className="text-gray-300">The foundation for digital transformation in Africa</p>
              </div>
            </div>
            
            {/* Animation item */}
            <div className="group flex gap-4 items-center bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1493962853295-0fd70327578a?auto=format&fit=crop&w=800&q=80" 
                  alt="Investing in Africa" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <h4 className="font-bold text-lg">Investing in African Innovation</h4>
                <p className="text-gray-300">Understanding the startup ecosystem and opportunities</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20">
            <Link to="/ai-animations">Explore All Animations</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AnimationsSection;
