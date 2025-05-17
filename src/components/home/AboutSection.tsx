
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
                src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80" 
                alt="Mbolela Pule with team" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute top-1/2 -right-12 transform -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl max-w-xs animate-slide-in">
              <blockquote className="italic text-flapabay-dark">
                "Technology should bridge gaps, not create them. We're building solutions that empower Africans in their daily lives."
              </blockquote>
              <p className="mt-4 font-bold">- Mbolela Pule</p>
            </div>
          </div>
          
          <div>
            <h2 className="heading-lg mb-6">
              African Innovation <span className="text-gradient">Leader</span>
            </h2>
            <p className="mb-4 text-lg">
              Mbolela Pule is the Founder and CEO of FlapaBay, a pioneering travel and logistics 
              technology company transforming mobility across Africa. With a unique blend of technical, 
              financial, and entrepreneurial expertise, he founded FlapaBay to harness technology for 
              social good.
            </p>
            <p className="mb-6 text-lg">
              His mission is to bridge the gap between technology and social impact, drive 
              economic growth, and foster community development throughout the continent, creating 
              sustainable opportunities for millions.
            </p>
            <Button asChild size="lg">
              <Link to="/about">Learn More About Mbolela</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
