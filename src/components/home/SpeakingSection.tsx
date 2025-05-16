import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const SpeakingSection = () => {
  return (
    <section className="bg-light-purple py-16 md:py-24">
      <div className="section-container">
        <h2 className="heading-lg text-center mb-4">Speaking & Media</h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Sharing insights on African tech, logistics innovation, and the future of travel
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Speaking Engagements */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-64 bg-gray-200 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551033406-611732b5e7ca?auto=format&fit=crop&w=800&q=80" 
                alt="Speaking Engagement" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <h3 className="text-white text-2xl font-bold p-6">Keynote Talks</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="mb-4">
                Mbolela Pule delivers engaging keynotes on leveraging technology to drive 
                economic growth in Africa, inspiring audiences with his vision for the future.
              </p>
              <Button asChild variant="outline" className="group">
                <Link to="/speaking/keynotes">
                  Explore Topics
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Media Appearances */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-64 bg-gray-200 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1508615070457-7ba790139638?auto=format&fit=crop&w=800&q=80" 
                alt="Media Appearance" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <h3 className="text-white text-2xl font-bold p-6">Interviews & Features</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="mb-4">
                Featured in leading publications and podcasts, Mbolela shares insights on 
                innovation, logistics, and the evolving landscape of African business.
              </p>
              <Button asChild variant="outline" className="group">
                <Link to="/speaking/media">
                  Watch & Listen
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SpeakingSection;
