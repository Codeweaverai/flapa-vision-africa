
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, VideoIcon, Users, MapPin, MessageCircle } from 'lucide-react';

const LearningSection = () => {
  return (
    <section className="bg-light-purple py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <h2 className="heading-lg mb-6">
              Learning & <span className="text-gradient">Consultation</span>
            </h2>
            <p className="text-lg mb-6">
              Book one-on-one mentorship sessions or consultations with Mbolela Pule to accelerate 
              your business growth. Get personalized advice on technology adoption, market entry strategies,
              and scaling your African business.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                <VideoIcon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-1">Google Meet Sessions</h3>
                <p className="text-sm text-muted-foreground">
                  Virtual consultations from anywhere in the world
                </p>
              </div>
              <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                <MapPin className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-1">In-Person Meetings</h3>
                <p className="text-sm text-muted-foreground">
                  Face-to-face sessions in select African cities
                </p>
              </div>
              <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                <Clock className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-1">Flexible Duration</h3>
                <p className="text-sm text-muted-foreground">
                  30, 60, or 90 minute sessions available
                </p>
              </div>
              <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                <MessageCircle className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-bold mb-1">Community Access</h3>
                <p className="text-sm text-muted-foreground">
                  Join our learning community for ongoing support
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/consult">Book a Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/community">Join Community</Link>
              </Button>
            </div>
          </div>
          
          <div className="order-1 md:order-2 relative">
            <div className="rounded-xl overflow-hidden shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" 
                alt="Consultation session" 
                className="w-full h-96 object-cover" 
              />
            </div>
            <div className="absolute -bottom-6 -right-6 md:bottom-12 md:-right-12 bg-white p-6 rounded-xl shadow-lg w-64">
              <div className="text-lg font-bold mb-2">Next Available</div>
              <div className="text-primary font-bold mb-1">May 20, 2025</div>
              <div className="text-sm text-muted-foreground">Book early to secure your spot</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningSection;
