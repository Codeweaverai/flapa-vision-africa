
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

const EventsSection = () => {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-6">Upcoming Events</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join exclusive events, workshops, and networking sessions designed to accelerate 
            your professional growth and expand your network across Africa.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Event Card 1 */}
          <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                Workshop
              </span>
              <span className="text-orange-600 font-bold">$99</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Digital Transformation Workshop</h3>
            <p className="text-muted-foreground mb-4">
              Learn how to leverage technology to scale your business across African markets.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                June 15, 2025
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                2:00 PM - 5:00 PM WAT
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                Lagos, Nigeria
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-orange-500" />
                50 spots available
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600">
              Register Now
            </Button>
          </div>

          {/* Event Card 2 */}
          <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                Networking
              </span>
              <span className="text-purple-600 font-bold">Free</span>
            </div>
            <h3 className="text-xl font-bold mb-3">African Tech Leaders Summit</h3>
            <p className="text-muted-foreground mb-4">
              Connect with leading entrepreneurs and innovators across the continent.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                July 20, 2025
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-purple-500" />
                9:00 AM - 6:00 PM EAT
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-purple-500" />
                Nairobi, Kenya
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                200 spots available
              </div>
            </div>
            <Button variant="outline" className="w-full border-purple-300 text-purple-600 hover:bg-purple-50">
              Join Summit
            </Button>
          </div>

          {/* Event Card 3 */}
          <div className="bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                Masterclass
              </span>
              <span className="text-orange-600 font-bold">$149</span>
            </div>
            <h3 className="text-xl font-bold mb-3">AI in African Business</h3>
            <p className="text-muted-foreground mb-4">
              Discover how artificial intelligence can transform your business operations.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-orange-500" />
                August 10, 2025
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-500" />
                10:00 AM - 4:00 PM SAST
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-orange-500" />
                Cape Town, South Africa
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-orange-500" />
                30 spots available
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600">
              Reserve Seat
            </Button>
          </div>
        </div>

        <div className="text-center">
          <Button asChild size="lg" variant="outline" className="border-2 border-orange-200 text-orange-600 hover:bg-orange-50">
            <Link to="/explore/events">View All Events</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
