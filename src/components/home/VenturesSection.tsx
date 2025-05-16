
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const VenturesSection = () => {
  return (
    <section className="bg-light-purple py-16 md:py-24">
      <div className="section-container">
        <h2 className="heading-lg text-center mb-4">Ventures</h2>
        <p className="text-xl text-center mb-16 max-w-3xl mx-auto">
          Building innovative solutions across travel and logistics to connect Africa and drive economic growth
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* FlapaBay Vacation Rentals */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-64 bg-gray-200 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=800&q=80" 
                alt="FlapaBay Vacation Rentals" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <h3 className="text-white text-2xl font-bold p-6">FlapaBay Vacation Rentals</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="mb-4">
                Experience Africa like never before with our curated selection of vacation 
                properties across the continent's most beautiful destinations. We combine 
                local insights with world-class hospitality.
              </p>
              <Button asChild variant="outline" className="group">
                <Link to="/ventures/vacation-rentals">
                  Learn More 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* FlapaBay Trucking */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden transform transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="h-64 bg-gray-200 relative overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80" 
                alt="FlapaBay Trucking" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <h3 className="text-white text-2xl font-bold p-6">FlapaBay Trucking</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="mb-4">
                Our logistics arm powers African commerce through technology-enabled 
                freight solutions. We connect businesses to reliable transportation 
                options, streamlining supply chains across borders.
              </p>
              <Button asChild variant="outline" className="group">
                <Link to="/ventures/trucking">
                  Learn More 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VenturesSection;
