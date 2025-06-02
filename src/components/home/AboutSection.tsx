
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutSection = () => {
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
      </div>
    </section>
  );
};

export default AboutSection;
