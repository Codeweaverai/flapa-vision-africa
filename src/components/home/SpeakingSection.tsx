
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const SpeakingSection = () => {
  return (
    <section className="section-container">
      <div className="text-center mb-12">
        <h2 className="heading-lg mb-4">Speaking & Media</h2>
        <p className="text-xl max-w-3xl mx-auto">
          Sharing insights on African innovation, technology, and entrepreneurship through keynotes, 
          panels, and workshops around the world.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Feature appearance */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200">
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80" 
              alt="Tech Conference" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">May 2024</div>
            <h3 className="text-xl font-bold mb-2">Africa Tech Summit</h3>
            <p className="mb-4">
              Keynote on "Leveraging Technology to Transform African Logistics"
            </p>
          </div>
        </div>
        
        {/* Feature appearance */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200">
            <img 
              src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80" 
              alt="Panel Discussion" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">March 2024</div>
            <h3 className="text-xl font-bold mb-2">CNN Africa Forward</h3>
            <p className="mb-4">
              Interview on "The Future of Travel Technology in Africa"
            </p>
          </div>
        </div>
        
        {/* Feature appearance */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="h-48 bg-gray-200">
            <img 
              src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80" 
              alt="Tech Podcast" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6">
            <div className="text-sm text-gray-500 mb-2">January 2024</div>
            <h3 className="text-xl font-bold mb-2">African Innovation Podcast</h3>
            <p className="mb-4">
              Guest episode on "Building Tech Companies for Africa's Future"
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link to="/speaking">View All Speaking & Media</Link>
        </Button>
      </div>
    </section>
  );
};

export default SpeakingSection;
