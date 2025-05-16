
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

const EventsSection = () => {
  return (
    <section className="bg-slate-50 py-16 md:py-24">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="heading-lg mb-4">Live Events</h2>
          <p className="text-xl max-w-3xl mx-auto">
            Join Mbolela for interactive webinars, mentorship sessions, and community 
            engagements focused on African innovation and entrepreneurship.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Event 1 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-primary text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">African Tech Innovation</h3>
              <div className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                June 15, 2024
              </div>
            </div>
            <div className="p-6">
              <p className="mb-6">
                A webinar on emerging technologies and their applications in solving 
                African challenges. Learn about real-world case studies and implementation strategies.
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  Webinar
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/events/tech-innovation">RSVP</Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Event 2 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-secondary text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Entrepreneurship Masterclass</h3>
              <div className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                July 8, 2024
              </div>
            </div>
            <div className="p-6">
              <p className="mb-6">
                A hands-on workshop covering business model development, fundraising, 
                and scaling strategies specifically for the African market context.
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                  Workshop
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/events/entrepreneurship">RSVP</Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Event 3 */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-accent text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Mentorship Session</h3>
              <div className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                July 22, 2024
              </div>
            </div>
            <div className="p-6">
              <p className="mb-6">
                An interactive group mentoring session where Mbolela provides guidance 
                on career development, startup challenges, and technology implementation.
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                  Mentoring
                </span>
                <Button asChild variant="outline" size="sm">
                  <Link to="/events/mentorship">RSVP</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link to="/events">View All Events</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
