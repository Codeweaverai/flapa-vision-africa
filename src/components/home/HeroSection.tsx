
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-flapabay-dark to-secondary min-h-[90vh] flex items-center">
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//40357%20(1).jpg')] bg-cover bg-center"></div>
      <div className="section-container relative z-10 grid md:grid-cols-2 gap-8 items-center">
        <div className="text-white animate-fade-in">
          <h1 className="heading-xl mb-6">
            <span className="text-gradient">Skills Marketplace</span> & Event Booking Platform
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-xl">
            Connecting professionals and learners with opportunities to grow,
            learn, and advance their careers through expert-led events and courses.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="text-lg">
              <Link to="/ventures">
                Discover SkillPulse
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg bg-white/10 backdrop-blur-sm hover:bg-white/20">
              <Link to="/consult">Book a Consultation</Link>
            </Button>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="relative">
            <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-2xl animate-zoom-in">
              <img 
                src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//pexels-olly-3769021.jpg" 
                alt="SkillPulse Platform" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-primary rounded-full flex items-center justify-center p-4 shadow-xl">
              <span className="text-white text-center font-bold">Skills & Events Marketplace</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
